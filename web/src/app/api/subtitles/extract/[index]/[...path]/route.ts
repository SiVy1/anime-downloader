import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { ARIA2_PATH } from "@/lib/downloader";
import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";
import { sanitizeFolderName } from "@/lib/utils/filesystem";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ index: string; path: string[] }> },
) {
  const { index, path: pathSegments } = await params;
  if (!ARIA2_PATH || pathSegments.length < 2) {
    console.error("[SubExtract] Invalid request or ARIA2_PATH missing");
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const folder = decodeURIComponent(pathSegments[0]);
  const filename = decodeURIComponent(pathSegments.slice(1).join("/"));
  const sanitizedFolder = sanitizeFolderName(folder);

  let fullPath = path.join(ARIA2_PATH, sanitizedFolder, filename);

  console.log("[SubExtract] Decoded folder:", folder);
  console.log("[SubExtract] Sanitized folder:", sanitizedFolder);
  console.log("[SubExtract] Decoded filename:", filename);
  console.log("[SubExtract] Attempting extract:", fullPath);

  if (!fs.existsSync(fullPath)) {
    // Fallback to unsanitized folder name
    const unsanitizedPath = path.join(ARIA2_PATH, folder, filename);
    console.log(
      "[SubExtract] Sanitized path not found, trying unsanitized:",
      unsanitizedPath,
    );
    if (fs.existsSync(unsanitizedPath)) {
      fullPath = unsanitizedPath;
    } else {
      console.error("[SubExtract] File not found at any path");
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  }

  const passThrough = new PassThrough();

  console.log(`[SUBTITLE EXTRACT] Extracting track ${index} from: ${fullPath}`);

  // FFmpeg extraction to VTT
  // index tutaj to numer ścieżki napisów (0, 1, 2...)
  const command = ffmpeg(fullPath)
    .outputOptions([`-map 0:s:${index}`, "-f webvtt"])
    .on("error", (err) => {
      console.error(`[SUBTITLE EXTRACTION ERROR] ${err.message}`);
      passThrough.destroy();
    });

  command.pipe(passThrough, { end: true });

  const webStream = new ReadableStream({
    start(controller) {
      passThrough.on("data", (chunk) => controller.enqueue(chunk));
      passThrough.on("end", () => controller.close());
      passThrough.on("error", (err) => controller.error(err));
    },
    cancel() {
      passThrough.destroy();
      command.kill("SIGKILL");
    },
  });

  return new NextResponse(webStream as any, {
    headers: {
      "Content-Type": "text/vtt",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
