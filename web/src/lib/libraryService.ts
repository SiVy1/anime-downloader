import { connectDB } from "./db";
import { Anime, Episode, IAnime, IEpisode } from "@/models/Anime";
import { ARIA2_PATH } from "./downloader";
import { getVideoFiles } from "./utils/filesystem";
import { extractEpisodeNumber } from "./animeParser";
import path from "path";
import fs from "fs";

/**
 * LibraryService - Handles anime library management
 *
 * Responsibilities:
 * - Linking local folders to anime entries
 * - Scanning for video files and mapping to episodes
 * - Managing library state
 */

export interface LinkFolderResult {
  success: boolean;
  linkedFolder: string;
  filesScanned: number;
  episodesMapped: number;
  error?: string;
}

/**
 * Link a local folder to an anime and sync episode files
 *
 * Uses MongoDB bulkWrite for efficient batch updates instead of N+1 updateOne calls
 *
 * @param malId - MyAnimeList ID of the anime
 * @param folderName - Name of the folder in ARIA2_PATH
 * @returns Result object with link statistics
 */
export async function linkFolderToAnime(
  malId: number,
  folderName: string,
): Promise<LinkFolderResult> {
  if (!ARIA2_PATH) {
    return {
      success: false,
      linkedFolder: folderName,
      filesScanned: 0,
      episodesMapped: 0,
      error: "ARIA2_PATH not configured",
    };
  }

  await connectDB();

  // 1. Find the anime in database
  const anime = await Anime.findOne({ malId });
  if (!anime) {
    return {
      success: false,
      linkedFolder: folderName,
      filesScanned: 0,
      episodesMapped: 0,
      error: "Anime not found in database",
    };
  }

  // 2. Verify folder exists
  const localDirPath = path.join(ARIA2_PATH, folderName);
  if (!fs.existsSync(localDirPath)) {
    return {
      success: false,
      linkedFolder: folderName,
      filesScanned: 0,
      episodesMapped: 0,
      error: "Local folder does not exist",
    };
  }

  // 3. Update anime with folder link
  anime.localFolderName = folderName;
  await anime.save();

  // 4. Scan folder for video files
  const videoFiles = getVideoFiles(localDirPath);

  // 5. Build bulk update operations (no N+1 problem!)
  const bulkOps: Array<{
    updateOne: {
      filter: { animeId: typeof anime._id; number: number };
      update: { $set: { localPath: string; isDownloaded: boolean } };
    };
  }> = [];

  for (const relativePath of videoFiles) {
    const fullPath = path.join(localDirPath, relativePath);
    const epNum = extractEpisodeNumber(fullPath);

    if (epNum !== null) {
      // Build the path relative to ARIA2_PATH for storage
      const storagePath = path
        .join(folderName, relativePath)
        .replace(/\\/g, "/");

      bulkOps.push({
        updateOne: {
          filter: { animeId: anime._id, number: epNum },
          update: {
            $set: {
              localPath: storagePath,
              isDownloaded: true,
            },
          },
        },
      });
    }
  }

  // 6. Execute bulk write (single database round-trip!)
  let episodesMapped = 0;
  if (bulkOps.length > 0) {
    const result = await Episode.bulkWrite(bulkOps, { ordered: false });
    episodesMapped = result.modifiedCount;
  }

  console.log(
    `[LibraryService] Linked folder "${folderName}" to anime ${malId}: ${videoFiles.length} files scanned, ${episodesMapped} episodes mapped`,
  );

  return {
    success: true,
    linkedFolder: folderName,
    filesScanned: videoFiles.length,
    episodesMapped,
  };
}

/**
 * Get all anime in the library with their linked status
 */
export async function getLibraryAnime(): Promise<IAnime[]> {
  await connectDB();
  return Anime.find({}).sort({ updatedAt: -1 });
}

/**
 * Unlink a folder from an anime
 */
export async function unlinkFolder(malId: number): Promise<boolean> {
  await connectDB();

  const anime = await Anime.findOne({ malId });
  if (!anime) return false;

  // Clear folder link
  anime.localFolderName = undefined;
  await anime.save();

  // Clear episode download status
  await Episode.updateMany(
    { animeId: anime._id },
    { $set: { localPath: undefined, isDownloaded: false } },
  );

  return true;
}
