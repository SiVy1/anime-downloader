import axios from "axios";
import { animeSubtitleService, SubtitleResult } from "./animeSubtitleService";
import { parseAnimeFilename } from "./animeParser";

/**
 * PolishSubtitleService - Integration with animesub.info
 *
 * This service scrapes animesub.info to find Polish subtitles for anime.
 * It attempts to match release groups to ensure synchronization.
 */
export interface PolishSubtitleResult extends SubtitleResult {
  sh: string; // Security hash from animesub.info
  id: string; // Subtitle ID from animesub.info
}

export class PolishSubtitleService {
  private readonly BASE_URL = "http://www.animesub.info";

  /**
   * Search for Polish subtitles on animesub.info
   *
   * @param filename - The original anime filename to extract group and title
   * @returns List of matching Polish subtitles
   */
  public async findPolishSubtitles(
    filename: string,
  ): Promise<SubtitleResult[]> {
    try {
      // Use centralized robust parser
      const parsed = await parseAnimeFilename(filename);
      if (!parsed.anime_title) return [];

      console.log(
        `[PolishSubtitleService] Searching for: ${parsed.anime_title}`,
      );

      // 1. Search animesub.info
      // szukane=[TITLE]&pTitle=all
      const searchUrl = `${this.BASE_URL}/szukaj.php?szukane=${encodeURIComponent(parsed.anime_title)}&pTitle=all`;

      const response = await axios.get(searchUrl, {
        responseType: "arraybuffer", // Handle ISO-8859-2 manually if needed
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      // Decode ISO-8859-2 to UTF-8
      const decoder = new TextDecoder("iso-8859-2");
      const html = decoder.decode(response.data);

      // 2. Parse HTML results
      const results = this.parseSearchResults(
        html,
        parsed.release_group,
        parsed.episode_number,
      );

      return results;
    } catch (error) {
      console.error(
        "[PolishSubtitleService] Error finding Polish subtitles:",
        error,
      );
      return [];
    }
  }

  /**
   * Parses the HTML from animesub.info search results
   *
   * The site structure is:
   * Each result is in a <table class="Napisy"> containing:
   * - 3 rows of class="KNap" (titles and metadata)
   * - 1 row of class="KKom" (download form and comment)
   */
  private parseSearchResults(
    html: string,
    targetGroup: string | null,
    targetEpisode: string | null,
  ): SubtitleResult[] {
    const results: SubtitleResult[] = [];

    // Each result entry is wrapped in a table with class "Napisy" and style "text-align:center"
    const tableBlocks = html
      .split(
        /<table[^>]*class=["']Napisy["'][^>]*style=["']text-align:center["'][^>]*>/i,
      )
      .slice(1);

    for (const tableBody of tableBlocks) {
      // 1. Extract titles (from KNap rows)
      // The first <td> in the first KNap row is usually the title
      const originalTitleMatch = tableBody.match(
        /<td[^>]*align=["']left["'][^>]*>(.*?)<\/td>/i,
      );
      const originalTitle = originalTitleMatch
        ? this.stripHtml(originalTitleMatch[1])
        : "Unknown Title";

      // 2. Extract download info from the KKom row
      const idMatch = tableBody.match(/name=["']id["'] value=["'](\d+)["']/i);
      const shMatch = tableBody.match(
        /name=["']sh["'] value=["']([a-f0-9]+)["']/i,
      );

      if (!idMatch || !shMatch) continue;

      const subId = idMatch[1];
      const subSh = shMatch[1];

      // 3. Extract release group/comment info (from KKom row's KNap cell)
      const commentMatch = tableBody.match(
        /<td[^>]*class=["']KNap["'][^>]*colspan=["']3["'][^>]*>([\s\S]*?)<\/td>/i,
      );
      const commentText = commentMatch ? this.stripHtml(commentMatch[1]) : "";

      // Determine match score/type
      let matchType: "exact_group" | "best_available" = "best_available";
      if (
        targetGroup &&
        commentText.toLowerCase().includes(targetGroup.toLowerCase())
      ) {
        matchType = "exact_group";
      }

      // Check if episode matches if we have a target episode
      if (targetEpisode) {
        const targetEpInt = parseInt(targetEpisode, 10);

        // Find all numbers in title and comments to see if any match our target episode
        // Normalizing to integers handles "01" vs "1" automatically
        const findNumbers = (text: string): number[] => {
          const matches = text.match(/\d+/g) || [];
          return matches.map((n) => parseInt(n, 10));
        };

        const allNumbers = [
          ...findNumbers(originalTitle),
          ...findNumbers(commentText),
        ];

        if (!allNumbers.includes(targetEpInt)) {
          console.log(
            `[PolishSubtitleService] Skipping mismatch: "${originalTitle}" (Target: ${targetEpInt}, Found: ${allNumbers.join(", ")})`,
          );
          continue;
        }
      }

      results.push({
        url: `/api/subtitles/polish/download?id=${subId}&sh=${subSh}`,
        filename: `${originalTitle}.zip`,
        format: "unknown",
        source: {
          tosho_id: parseInt(subId),
          title: originalTitle,
          release_group: commentText || null,
          match_type: matchType,
        },
      });
    }

    // Sort: Exact matches first
    return results.sort((a, b) => {
      if (
        a.source.match_type === "exact_group" &&
        b.source.match_type !== "exact_group"
      )
        return -1;
      if (
        a.source.match_type !== "exact_group" &&
        b.source.match_type === "exact_group"
      )
        return 1;
      return 0;
    });
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").trim();
  }
}

export const polishSubtitleService = new PolishSubtitleService();
