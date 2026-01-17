/**
 * AnimeSubtitleService - Smart Resolver for Anime Subtitles
 *
 * This service uses the AniDB/Anime Tosho ecosystem to find properly
 * synchronized subtitles for anime files. Unlike generic subtitle search
 * (OpenSubtitles), this approach matches the exact release group to ensure
 * timing synchronization.
 *
 * WHY RELEASE GROUP MATCHING MATTERS:
 * Different fansub groups use different video sources and encoding settings.
 * Subtitles from [SubsPlease] will be perfectly synced with [SubsPlease] releases,
 * but may be off by seconds with another group's encode. This service prioritizes
 * matching the release group from your local file to ensure perfect sync.
 */

import axios, { AxiosError } from "axios";

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/** Parsed file metadata from anitomy */
export interface ParsedAnimeFile {
  anime_title: string;
  episode_number: string | null;
  release_group: string | null;
  video_resolution: string | null;
}

/** Single attachment from Anime Tosho entry */
export interface AnimeToshoAttachment {
  type: string;
  url: string;
  size: number;
  name?: string;
}

/** Single entry from Anime Tosho search results */
export interface AnimeToshoEntry {
  id: number;
  title: string;
  link: string;
  timestamp: number;
  status: string;
  tosho_id: number;
  nyaa_id: number | null;
  anidb_aid: number | null;
  anidb_eid: number | null;
  anidb_fid: number | null;
  article_title: string | null;
  article_url: string | null;
  website_url: string | null;
  magnet_uri: string | null;
  total_size: number;
  num_files: number;
  seeders: number;
  leechers: number;
  torrent_url: string | null;
  nzb_url: string | null;
  attachments?: AnimeToshoAttachment[];
}

/** API response from Anime Tosho */
export interface AnimeToshoResponse extends Array<AnimeToshoEntry> {}

/** Final result returned by the service */
export interface SubtitleResult {
  url: string;
  filename: string;
  format: "ass" | "srt" | "unknown";
  source: {
    tosho_id: number;
    title: string;
    release_group: string | null;
    match_type: "exact_group" | "trusted_fallback" | "best_available";
  };
}

/** Internal scoring result for entries */
interface ScoredEntry {
  entry: AnimeToshoEntry;
  score: number;
  matchType: "exact_group" | "trusted_fallback" | "best_available";
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ANIME_TOSHO_API = "https://feed.animetosho.org/json";

/** Trusted fansub groups for fallback when exact match unavailable */
const TRUSTED_GROUPS = [
  "subsplease",
  "erai-raws",
  "horriblesubs",
  "judas",
  "asw",
];

/** Subtitle format priority (higher index = higher priority) */
const SUBTITLE_PRIORITY: Record<string, number> = {
  srt: 1,
  ass: 2,
  ssa: 2,
};

// =============================================================================
// HTTP UTILITIES
// =============================================================================

/**
 * Exponential backoff delay calculator
 * @param attempt - Current attempt number (0-indexed)
 * @returns Delay in milliseconds
 */
function getBackoffDelay(attempt: number): number {
  // 1s, 2s, 4s
  return Math.pow(2, attempt) * 1000;
}

/**
 * Sleep for given milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with exponential backoff retry logic
 * Respects API rate limits by retrying on 429/503 with increasing delays
 */
async function fetchWithRetry<T>(
  url: string,
  params: Record<string, string>,
  maxRetries: number = 3,
  timeoutMs: number = 10000,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.get<T>(url, {
        params,
        timeout: timeoutMs,
        headers: {
          "User-Agent": "AnimeSubtitleResolver/1.0",
        },
      });
      return response.data;
    } catch (error) {
      lastError = error as Error;

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        // Don't retry on client errors (except 429)
        if (
          axiosError.response?.status &&
          axiosError.response.status >= 400 &&
          axiosError.response.status < 500 &&
          axiosError.response.status !== 429
        ) {
          throw error;
        }

        // Retry on 429 (rate limit) or 5xx errors
        if (
          axiosError.response?.status === 429 ||
          (axiosError.response?.status && axiosError.response.status >= 500)
        ) {
          const delay = getBackoffDelay(attempt);
          console.log(
            `[AnimeSubtitleService] Rate limited or server error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`,
          );
          await sleep(delay);
          continue;
        }

        // Retry on timeout/network errors
        if (
          axiosError.code === "ECONNABORTED" ||
          axiosError.code === "ENOTFOUND"
        ) {
          const delay = getBackoffDelay(attempt);
          console.log(
            `[AnimeSubtitleService] Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`,
          );
          await sleep(delay);
          continue;
        }
      }

      // Unknown error, throw immediately
      throw error;
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

// =============================================================================
// ANIME SUBTITLE SERVICE
// =============================================================================

export class AnimeSubtitleService {
  /**
   * Main entry point: Find subtitles for an anime file
   *
   * @param filename - The anime filename (e.g., "[SubsPlease] One Piece - 1000 (1080p).mkv")
   * @returns SubtitleResult with download URL, or null if not found
   */
  public async findSubtitles(filename: string): Promise<SubtitleResult | null> {
    try {
      // Step 1: Parse filename semantically
      const parsed = await this.parseFilename(filename);
      console.log("[AnimeSubtitleService] Parsed file:", parsed);

      if (!parsed.anime_title) {
        console.log(
          "[AnimeSubtitleService] Could not extract anime title from filename",
        );
        return null;
      }

      // Step 2: Resolve AniDB ID via Anime Tosho title search
      const anidbAid = await this.resolveAnidbId(parsed.anime_title);

      if (!anidbAid) {
        console.log("[AnimeSubtitleService] Could not resolve AniDB ID");
        return null;
      }

      console.log(`[AnimeSubtitleService] Resolved AniDB ID: ${anidbAid}`);

      // Step 3: Query Anime Tosho with AID + episode
      const entries = await this.fetchAnimeToshoEntries(
        anidbAid,
        parsed.episode_number,
      );

      if (entries.length === 0) {
        console.log("[AnimeSubtitleService] No entries found on Anime Tosho");
        return null;
      }

      console.log(`[AnimeSubtitleService] Found ${entries.length} entries`);

      // Step 4: Smart Resolver - Score and select best entry
      const bestEntry = this.selectBestEntry(entries, parsed.release_group);

      if (!bestEntry) {
        console.log(
          "[AnimeSubtitleService] No suitable entry found after scoring",
        );
        return null;
      }

      console.log(
        `[AnimeSubtitleService] Selected entry: "${bestEntry.entry.title}" (match: ${bestEntry.matchType})`,
      );

      // Step 5: Extract subtitle attachment
      const subtitle = this.extractSubtitleAttachment(bestEntry.entry);

      if (!subtitle) {
        console.log(
          "[AnimeSubtitleService] No subtitle attachments found in selected entry",
        );
        return null;
      }

      return {
        url: subtitle.url,
        filename: subtitle.name || `subtitle.${subtitle.format}`,
        format: subtitle.format as "ass" | "srt" | "unknown",
        source: {
          tosho_id: bestEntry.entry.tosho_id,
          title: bestEntry.entry.title,
          release_group: parsed.release_group,
          match_type: bestEntry.matchType,
        },
      };
    } catch (error) {
      console.error("[AnimeSubtitleService] Error finding subtitles:", error);
      return null;
    }
  }

  /**
   * Step 1: Parse anime filename using anitomyscript
   * Extracts structured metadata from typical anime release filenames
   */
  private async parseFilename(filename: string): Promise<ParsedAnimeFile> {
    // Dynamic import for anitomyscript (ESM module, default export)
    const anitomyscript = await import("anitomyscript");
    const parse = anitomyscript.default;

    const result = await parse(filename);
    // parse() returns AnitomyResult | AnitomyResult[] - for single input it's AnitomyResult
    const parsed = Array.isArray(result) ? result[0] : result;

    return {
      anime_title: parsed.anime_title || "",
      episode_number: parsed.episode_number || null,
      release_group: parsed.release_group || null,
      video_resolution: parsed.video_resolution || null,
    };
  }

  /**
   * Step 2: Resolve AniDB ID from anime title
   *
   * Since we don't have file hash access (only filename), we use Anime Tosho
   * title search as a fallback to get the anidb_aid from results.
   */
  private async resolveAnidbId(title: string): Promise<number | null> {
    try {
      // Search Anime Tosho by title to get anidb_aid
      const response = await fetchWithRetry<AnimeToshoResponse>(
        ANIME_TOSHO_API,
        {
          t: "search",
          q: title,
        },
      );

      if (response.length === 0) {
        return null;
      }

      // Find first entry with a valid anidb_aid
      for (const entry of response) {
        if (entry.anidb_aid && entry.anidb_aid > 0) {
          return entry.anidb_aid;
        }
      }

      return null;
    } catch (error) {
      console.error("[AnimeSubtitleService] Error resolving AniDB ID:", error);
      return null;
    }
  }

  /**
   * Step 3: Fetch entries from Anime Tosho using AniDB ID and episode
   *
   * Query format: q=aid:{AID}+ep:{EPISODE_NUMBER}
   * This ID-based search is more accurate than title-based search.
   */
  private async fetchAnimeToshoEntries(
    anidbAid: number,
    episodeNumber: string | null,
  ): Promise<AnimeToshoEntry[]> {
    try {
      // Build query: aid:{AID} or aid:{AID}+ep:{EPISODE}
      let query = `aid:${anidbAid}`;
      if (episodeNumber) {
        query += `+ep:${episodeNumber}`;
      }

      const response = await fetchWithRetry<AnimeToshoResponse>(
        ANIME_TOSHO_API,
        {
          t: "search",
          q: query,
        },
      );

      return response;
    } catch (error) {
      console.error(
        "[AnimeSubtitleService] Error fetching Anime Tosho entries:",
        error,
      );
      return [];
    }
  }

  /**
   * Step 4: Smart Resolver - Score and select the best entry
   *
   * Scoring priority:
   * 1. EXACT GROUP MATCH (100 points) - Entry title contains our release group
   *    This is critical for timing synchronization!
   * 2. TRUSTED GROUP (50 points) - Entry is from a known trusted fansub group
   * 3. POPULARITY (0-10 points) - Based on seeders count
   *
   * Returns immediately on exact group match for efficiency.
   */
  private selectBestEntry(
    entries: AnimeToshoEntry[],
    localReleaseGroup: string | null,
  ): ScoredEntry | null {
    const scoredEntries: ScoredEntry[] = [];
    const localGroupLower = localReleaseGroup?.toLowerCase() || null;

    for (const entry of entries) {
      const titleLower = entry.title.toLowerCase();
      let score = 0;
      let matchType: ScoredEntry["matchType"] = "best_available";

      // Check for exact release group match
      // WHY: Subtitles from the same release group are guaranteed to be
      // perfectly synchronized with the video timing
      if (localGroupLower && titleLower.includes(`[${localGroupLower}]`)) {
        console.log(
          `[AnimeSubtitleService] EXACT GROUP MATCH: "${entry.title}" contains [${localGroupLower}]`,
        );
        // Return immediately - this is a perfect match
        return {
          entry,
          score: 100,
          matchType: "exact_group",
        };
      }

      // Check for trusted groups
      for (const trustedGroup of TRUSTED_GROUPS) {
        if (titleLower.includes(`[${trustedGroup}]`)) {
          score += 50;
          matchType = "trusted_fallback";
          break;
        }
      }

      // Add popularity score (seeders, capped at 10 points)
      score += Math.min(entry.seeders, 10);

      // Add size bonus for larger files (likely better quality)
      if (entry.total_size > 500 * 1024 * 1024) {
        score += 5;
      }

      scoredEntries.push({ entry, score, matchType });
    }

    // Sort by score descending
    scoredEntries.sort((a, b) => b.score - a.score);

    return scoredEntries[0] || null;
  }

  /**
   * Step 5: Extract subtitle attachment from entry
   *
   * Priority: .ass > .srt (ASS supports styling, timing is more precise)
   * Returns the highest priority subtitle attachment URL
   */
  private extractSubtitleAttachment(
    entry: AnimeToshoEntry,
  ): { url: string; name: string; format: string } | null {
    if (!entry.attachments || entry.attachments.length === 0) {
      return null;
    }

    // Filter to subtitle files only
    const subtitleAttachments = entry.attachments.filter((att) => {
      const ext = this.getExtension(att.url).toLowerCase();
      return ext === "ass" || ext === "ssa" || ext === "srt";
    });

    if (subtitleAttachments.length === 0) {
      return null;
    }

    // Sort by priority (ASS > SRT)
    subtitleAttachments.sort((a, b) => {
      const extA = this.getExtension(a.url).toLowerCase();
      const extB = this.getExtension(b.url).toLowerCase();
      return (SUBTITLE_PRIORITY[extB] || 0) - (SUBTITLE_PRIORITY[extA] || 0);
    });

    const best = subtitleAttachments[0];
    const ext = this.getExtension(best.url).toLowerCase();

    return {
      url: best.url,
      name: best.name || `subtitle.${ext}`,
      format: ext,
    };
  }

  /**
   * Get file extension from URL or filename
   */
  private getExtension(filename: string): string {
    const match = filename.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    return match ? match[1] : "";
  }
}

// Export singleton instance
export const animeSubtitleService = new AnimeSubtitleService();
