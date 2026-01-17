/**
 * animeParser - Robust anime filename parsing with regex fallback
 *
 * This utility wraps 'anitomyscript' (which uses WASM) and provides
 * a pure JavaScript regex-based fallback if the WASM fails to load
 * (common in some Node/VPS environments).
 */

export interface ParsedAnimeFile {
  anime_title: string;
  episode_number: string | null;
  release_group: string | null;
  video_resolution: string | null;
}

/**
 * Parses anime filename with WASM-based Anitomy, falling back to regex on error.
 */
export async function parseAnimeFilename(
  filename: string,
): Promise<ParsedAnimeFile> {
  const cleanFilename = filename.split("/").pop() || filename;

  try {
    // 1. Attempt using anitomyscript (WASM)
    const anitomyscript = await import("anitomyscript");
    const parse = anitomyscript.default;
    const result = await parse(cleanFilename);
    const parsed = Array.isArray(result) ? result[0] : result;

    if (parsed && parsed.anime_title) {
      return {
        anime_title: parsed.anime_title || "",
        episode_number: parsed.episode_number || null,
        release_group: parsed.release_group || null,
        video_resolution: parsed.video_resolution || null,
      };
    }

    // Fall through if it parsed but didn't find a title
    throw new Error("Anitomy failed to extract title");
  } catch (err) {
    console.warn(
      "[AnimeParser] Anitomy WASM failed or threw error, using regex fallback:",
      err,
    );
    return simpleParseFilename(cleanFilename);
  }
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
  // Priority:
  // - " - 01"
  // - "Ep 01"
  // - "E01"
  let episode_number: string | null = null;
  const epMatch =
    workingName.match(/\s-\s(\d{1,4})(\s|$)/) ||
    workingName.match(/Ep\s?(\d{1,4})/i) ||
    workingName.match(/E(\d{1,4})\b/i);

  if (epMatch) {
    episode_number = epMatch[1];
    // Remove episode from name to help isolate title
    workingName = workingName.replace(epMatch[0], " ").trim();
  }

  // 4. Remaining text is likely the title
  // Clean up common leftovers like hashes [AABBCCDD] or leading/trailing dashes
  let anime_title = workingName
    .replace(/\[[A-F0-9]{8}\]/i, "") // CRC hash
    .replace(/^[\s\-_]+|[\s\-_]+$/g, "") // Leading/trailing junk
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();

  // If we still have no title but have a group/filename, use filenames head
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
