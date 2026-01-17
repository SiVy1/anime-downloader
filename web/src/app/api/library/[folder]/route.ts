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
  const downloadingFiles = await getAllDownloadingFiles();
  if (!ARIA2_PATH) {
    return NextResponse.json(
      { error: "ARIA2_PATH not configured" },
      { status: 500 },
    );
  }

  try {
    const fullPath = path.join(ARIA2_PATH, folder);
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    await connectDB();
    const anime = await Anime.findOne({ localFolderName: folder });

    const getAllFiles = (dirPath: string, arrayOfFiles: string[] = []) => {
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
              .relative(fullPath, path.join(dirPath, file.name))
              .replace(/\\/g, "/");
            arrayOfFiles.push(relativePath);
          }
        }
      });

      return arrayOfFiles;
    };

    const localFiles = getAllFiles(fullPath).sort();

    /**
     * Helper to extract episode number from filename
     */
    const extractEpisodeNumber = (filename: string): number | null => {
      const cleanName = filename.split("/").pop() || "";
      const match =
        cleanName.match(/[Ee](\d+)/) ||
        cleanName.match(/Ep\s*(\d+)/i) ||
        cleanName.match(/\s-\s(\d+)/) ||
        cleanName.match(/\[(\d+)\]/) ||
        cleanName.match(/\b(\d{1,3})\b/);

      return match ? parseInt(match[1], 10) : null;
    };

    if (anime) {
      // Synchronize database episodes with local files
      const dbEpisodes = await Episode.find({ animeId: anime._id }).sort({
        number: 1,
      });

      // Update episodes with local info
      const syncedEpisodes = await Promise.all(
        dbEpisodes.map(async (ep) => {
          const matchingFile = localFiles.find((f) => {
            const epNum = extractEpisodeNumber(f);
            return epNum === ep.number;
          });

          if (
            matchingFile &&
            (!ep.isDownloaded || ep.localPath !== matchingFile)
          ) {
            ep.isDownloaded = true;
            ep.localPath = matchingFile;
            await ep.save();
          } else if (!matchingFile && ep.isDownloaded) {
            ep.isDownloaded = false;
            // ep.localPath = undefined; // Optional: keep for history?
            await ep.save();
          }
          return ep;
        }),
      );

      return NextResponse.json({
        anime,
        episodes: syncedEpisodes,
        downloadingFiles,
      });
    }

    // Fallback if not in DB: return just file list as pseudo-episodes
    return NextResponse.json({ files: localFiles, downloadingFiles });
  } catch (error: any) {
    console.error("[Library Folder API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
