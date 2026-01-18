import { connectDB } from "./db";
import { Anime, Episode, IAnime, IEpisode } from "@/models/Anime";
import { ARIA2_PATH } from "./downloader";
import { getVideoFiles, exists, sanitizeFolderName } from "./utils/filesystem";
import { extractEpisodeNumber } from "./animeParser";
import path from "path";

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
 * @param anilistId - MyAnimeList ID of the anime
 * @param folderName - Name of the folder in ARIA2_PATH
 * @returns Result object with link statistics
 */
export async function linkFolderToAnime(
  anilistId: number,
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

  // 0. Sanitize folder name for consistency
  const sanitizedFolder = sanitizeFolderName(folderName);

  // 1. Find the anime in database
  const anime = await Anime.findOne({ anilistId });
  if (!anime) {
    return {
      success: false,
      linkedFolder: sanitizedFolder,
      filesScanned: 0,
      episodesMapped: 0,
      error: "Anime not found in database",
    };
  }

  // 2. Check if folder exists physically (for scanning)
  const localDirPath = path.join(ARIA2_PATH, sanitizedFolder);
  const folderExists = await exists(localDirPath);

  // 3. Update anime with folder link (always do this if anime exists)
  anime.localFolderName = sanitizedFolder;
  await anime.save();

  if (!folderExists) {
    console.log(
      `[LibraryService] Linked folder name "${sanitizedFolder}" (from "${folderName}") to anime ${anilistId}, but physical folder does not exist yet (expected for new downloads).`,
    );
    return {
      success: true,
      linkedFolder: folderName,
      filesScanned: 0,
      episodesMapped: 0,
    };
  }

  // 4. Scan folder for video files (Asynchronous)
  const videoFiles = await getVideoFiles(localDirPath);

  // 5. Build bulk update operations (no N+1 problem!)
  const bulkOps: Array<{
    updateOne: {
      filter: { animeId: typeof anime._id; number: number };
      update: { $set: { localPath: string; isDownloaded: boolean; downloadedAt?: Date } };
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
              downloadedAt: new Date(),
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

    // Update anime updatedAt to reflect library changes
    await Anime.updateOne({ _id: anime._id }, { $set: { updatedAt: new Date() } });
  }


  console.log(
    `[LibraryService] Linked folder "${folderName}" to anime ${anilistId}: ${videoFiles.length} files scanned, ${episodesMapped} episodes mapped`,
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
export async function unlinkFolder(anilistId: number): Promise<boolean> {
  await connectDB();

  const anime = await Anime.findOne({ anilistId });
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
