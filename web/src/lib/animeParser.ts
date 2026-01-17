/**
 * animeParser - Robust anime filename parsing without binary dependencies
 *
 * This utility uses 'anime-name-tool' (pure JS) to parse anime filenames.
 * It replaces the crashing 'anitomyscript' (WASM) to ensure stability
 * across all environments (local, VPS, Docker, etc.).
 */

import { parseFileName } from "anime-name-tool";

export interface ParsedAnimeFile {
  anime_title: string;
  episode_number: string | null;
  release_group: string | null;
  video_resolution: string | null;
}

/**
 * Parses anime filename with pure JS parser, falling back to regex on error.
 */
export async function parseAnimeFilename(
  filename: string,
): Promise<ParsedAnimeFile> {
  const cleanFilename = filename.split("/").pop() || filename;

  try {
    // 1. Use pure JS anime-name-tool
    const result = parseFileName(cleanFilename);

    if (result && result.title) {
      // Extract release group from [Group] Title... format
      let group: string | null = null;
      if (result.groupIndex && result.groupIndex.content) {
        group = result.groupIndex.content.replace(/^\[|\]$/g, "");
      }

      return {
        anime_title: result.title,
        episode_number: result.episode ? String(result.episode) : null,
        release_group: group,
        video_resolution: result.quality?.resolution || null,
      };
    }
  } catch (err) {
    console.warn(
      "[AnimeParser] Pure JS parser failed, using regex fallback:",
      err,
    );
  }

  // 2. Ultimate Fallback (Regex)
  return simpleParseFilename(cleanFilename);
}

/**
 * Regex-based fallback for parsing anime filenames.
 * Handles common fansub patterns: [Group] Title - 01 [Resolution].mkv
 */
function simpleParseFilename(filename: string): ParsedAnimeFile {
  let workingName = filename.replace(/\.(mkv|mp4|avi|mov|wmv)$/i, "").trim();

  // 1. Extract Release Group (text inside first square brackets)
  let release_group: string | null = null;
  const groupMatch = workingName.match(/^\[(.*?)\]/);
  if (groupMatch) {
    release_group = groupMatch[1];
    workingName = workingName.replace(groupMatch[0], "").trim();
  }

  // 2. Extract Resolution (text inside [1080p], [720p], etc)
  let video_resolution: string | null = null;
  const resMatch =
    workingName.match(/\[(\d+p)\]/i) || workingName.match(/\((\d+p)\)/i);
  if (resMatch) {
    video_resolution = resMatch[1];
    workingName = workingName.replace(resMatch[0], "").trim();
  }

  // 3. Extract Episode Number
  let episode_number: string | null = null;
  const epMatch =
    workingName.match(/\s-\s(\d{1,4})(\s|$)/) ||
    workingName.match(/Ep\s?(\d{1,4})/i) ||
    workingName.match(/E(\d{1,4})\b/i) ||
    workingName.match(/\b(\d{1,4})\b/); // Bare number as last resort

  if (epMatch) {
    episode_number = epMatch[1];
    workingName = workingName.replace(epMatch[0], " ").trim();
  }

  // 4. Remaining text is likely the title
  let anime_title = workingName
    .replace(/\[[A-F0-9]{8}\]/i, "")
    .replace(/^[\s\-_]+|[\s\-_]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!anime_title) {
    anime_title = filename.split(".")[0] || filename;
  }

  return {
    anime_title,
    episode_number,
    release_group,
    video_resolution,
  };
}

/**
 * Extract episode number from a filename
 *
 * Handles common patterns:
 * - SubsPlease format: "Title - 03v2" or "Title - 03 (1080p)"
 * - Season format: S01E03
 * - Numbered format: Ep 03, E03
 * - Bracketed: [03]
 *
 * @param filename - The filename to parse
 * @returns Episode number as integer, or null if not found
 */
export function extractEpisodeNumber(filename: string): number | null {
  const cleanName = filename.split("/").pop() || "";
  // Order matters! SubsPlease format " - 03v2" should be checked FIRST
  const match =
    cleanName.match(/\s-\s(\d{1,3})(?:v\d+)?/) || // " - 03v2" format (SubsPlease)
    cleanName.match(/S\d+E(\d+)/i) || // S01E03 format
    cleanName.match(/\bEp?\s*(\d{1,3})\b/i) || // "E03" or "Ep 03" with word boundary
    cleanName.match(/\[(\d{1,3})\]/) || // [03] but not [F2DE2719] (max 3 digits)
    cleanName.match(/\b(\d{1,2})(?:v\d+)?\s*\(/); // "03v2 (" before resolution

  return match ? parseInt(match[1], 10) : null;
}
