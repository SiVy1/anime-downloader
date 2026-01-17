import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ARIA2_PATH, getAllDownloadingFiles } from "@/lib/downloader";
import { connectDB } from "@/lib/db";
import { Anime, Episode } from "@/models/Anime";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ folder: string }> },
) {
  const { folder } = await params;
  const decodedFolder = decodeURIComponent(folder);
  const downloadingFiles = await getAllDownloadingFiles();

  try {
    await connectDB();

    // 1. Try to find anime in database by folder name OR by title
    let anime = await Anime.findOne({ localFolderName: decodedFolder });
    if (!anime) {
      // Fallback: try to find by title (for newly tracked anime without folder)
      anime = await Anime.findOne({ title: decodedFolder });
    }

    // 2. Check if local folder exists
    const fullPath = ARIA2_PATH ? path.join(ARIA2_PATH, decodedFolder) : null;
    const folderExists = fullPath && fs.existsSync(fullPath);

    // Helper to get all video files from folder
    const getAllFiles = (dirPath: string, arrayOfFiles: string[] = []) => {
      if (!fs.existsSync(dirPath)) return arrayOfFiles;
      const files = fs.readdirSync(dirPath, { withFileTypes: true });

      files.forEach((file) => {
        if (file.isDirectory()) {
          arrayOfFiles = getAllFiles(
            path.join(dirPath, file.name),
            arrayOfFiles,
          );
        } else {
          const ext = path.extname(file.name).toLowerCase();
          if ([".mkv", ".mp4", ".avi", ".mov"].includes(ext)) {
            const relativePath = path
              .relative(dirPath, path.join(dirPath, file.name))
              .replace(/\\/g, "/");
            arrayOfFiles.push(relativePath);
          }
        }
      });

      return arrayOfFiles;
    };

    const localFiles = folderExists ? getAllFiles(fullPath!).sort() : [];
    console.log(
      `[Library Debug] Folder: ${decodedFolder}, Files found:`,
      localFiles,
    );

    // Helper to extract episode number from filename
    const extractEpisodeNumber = (filename: string): number | null => {
      const cleanName = filename.split("/").pop() || "";
      // Order matters! SubsPlease format " - 03v2" should be checked FIRST
      const match =
        cleanName.match(/\s-\s(\d{1,3})(?:v\d+)?/) || // " - 03v2" format (SubsPlease)
        cleanName.match(/S\d+E(\d+)/i) || // S01E03 format
        cleanName.match(/\bEp?\s*(\d{1,3})\b/i) || // "E03" or "Ep 03" with word boundary
        cleanName.match(/\[(\d{1,3})\]/) || // [03] but not [F2DE2719] (max 3 digits)
        cleanName.match(/\b(\d{1,2})(?:v\d+)?\s*\(/); // "03v2 (" before resolution

      return match ? parseInt(match[1], 10) : null;
    };

    // 3. If anime is in database, return episodes from DB
    if (anime) {
      const dbEpisodes = await Episode.find({ animeId: anime._id }).sort({
        number: 1,
      });

      // Sync episodes with local files
      const syncedEpisodes = await Promise.all(
        dbEpisodes.map(async (ep) => {
          const matchingFile = localFiles.find((f) => {
            const epNum = extractEpisodeNumber(f);
            console.log(
              `[Library Debug] File: ${f}, Extracted: ${epNum}, Looking for: ${ep.number}`,
            );
            return epNum === ep.number;
          });

          if (
            matchingFile &&
            (!ep.isDownloaded || ep.localPath !== matchingFile)
          ) {
            console.log(
              `[Library Sync] Episode ${ep.number}: Setting isDownloaded=true, localPath=${matchingFile}`,
            );
            ep.isDownloaded = true;
            ep.localPath = matchingFile;
            await ep.save();
          } else if (!matchingFile && (ep.isDownloaded || ep.localPath)) {
            // Clear both isDownloaded AND stale localPath
            console.log(
              `[Library Sync] Episode ${ep.number}: Clearing (file not found, isDownloaded=${ep.isDownloaded}, localPath=${ep.localPath})`,
            );
            ep.isDownloaded = false;
            ep.localPath = undefined;
            await ep.save();
          }
          console.log(
            `[Library Sync] Episode ${ep.number}: Final state isDownloaded=${ep.isDownloaded}`,
          );
          return ep;
        }),
      );

      return NextResponse.json({
        anime,
        episodes: syncedEpisodes,
        files: localFiles,
        downloadingFiles,
      });
    }

    // 4. If no anime in DB but folder exists, return just files
    if (folderExists && localFiles.length > 0) {
      return NextResponse.json({ files: localFiles, downloadingFiles });
    }

    // 5. Neither DB entry nor local folder - try to find by title search
    // This allows streaming even without folder linked
    return NextResponse.json({
      files: [],
      episodes: [],
      downloadingFiles,
      message: "No anime linked to this folder. Add to library first.",
    });
  } catch (error: any) {
    console.error("[Library Folder API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
