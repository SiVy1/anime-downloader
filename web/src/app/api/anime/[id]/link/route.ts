import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { connectDB } from "@/lib/db";
import { Anime, Episode } from "@/models/Anime";
import { ARIA2_PATH } from "@/lib/downloader";

/**
 * Extracts episode number from filename
 */
export const extractEpisodeNumber = (filename: string): number | null => {
  const cleanName = filename.split("/").pop() || "";
  // High quality matches: E01, Ep 01, S01E01
  const match =
    cleanName.match(/\s-\s(\d{1,3})\b/) ||
    cleanName.match(/[Ee](\d{1,3})\b/) ||
    cleanName.match(/Ep\s*(\d{1,3})/i) ||
    cleanName.match(/\[(\d{1,3})\]/) ||
    cleanName.match(/\b(\d{1,3})\b/);

  return match ? parseInt(match[1], 10) : null;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: malIdStr } = await params;
  const malId = parseInt(malIdStr, 10);
  const { folderName } = await req.json();

  if (!folderName || !ARIA2_PATH) {
    return NextResponse.json(
      { error: "Missing folderName or configuration" },
      { status: 400 },
    );
  }

  try {
    await connectDB();
    const anime = await Anime.findOne({ malId });
    if (!anime)
      return NextResponse.json(
        { error: "Anime not found in DB" },
        { status: 404 },
      );

    // 1. Link the folder
    anime.localFolderName = folderName;
    await anime.save();

    // 2. Scan the folder
    const localDirPath = path.join(ARIA2_PATH, folderName);
    if (!fs.existsSync(localDirPath)) {
      return NextResponse.json(
        { error: "Local folder does not exist" },
        { status: 404 },
      );
    }

    const scanFiles = (dir: string, fileList: string[] = []) => {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      files.forEach((file) => {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
          scanFiles(fullPath, fileList);
        } else {
          const ext = path.extname(file.name).toLowerCase();
          if ([".mkv", ".mp4", ".avi", ".mov"].includes(ext)) {
            fileList.push(fullPath);
          }
        }
      });
      return fileList;
    };

    const localFiles = scanFiles(localDirPath);
    let updatedCount = 0;

    for (const filePath of localFiles) {
      const epNum = extractEpisodeNumber(filePath);
      if (epNum !== null) {
        const relativePath = path
          .relative(ARIA2_PATH, filePath)
          .replace(/\\/g, "/");

        // Update the episode matching this number
        const result = await Episode.updateOne(
          { animeId: anime._id, number: epNum },
          {
            $set: {
              localPath: relativePath,
              isDownloaded: true,
            },
          },
        );
        if (result.modifiedCount > 0) updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      linkedFolder: folderName,
      filesScanned: localFiles.length,
      episodesMapped: updatedCount,
    });
  } catch (err: any) {
    console.error(`[Link API] Error linking folder ${folderName}:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
