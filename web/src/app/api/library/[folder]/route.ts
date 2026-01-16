import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ARIA2_PATH } from "@/lib/downloader";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ folder: string }> },
) {
  const { folder } = await params;
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
            // Zwracamy ścieżkę względną do 'fullPath' (czyli do folderu anime)
            // Używamy slasha / nawet na Windowsie dla spójności w URL
            const relativePath = path
              .relative(fullPath, path.join(dirPath, file.name))
              .replace(/\\/g, "/");
            arrayOfFiles.push(relativePath);
          }
        }
      });

      return arrayOfFiles;
    };

    const files = getAllFiles(fullPath).sort();

    return NextResponse.json({ files });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
