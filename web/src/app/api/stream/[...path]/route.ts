import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ARIA2_PATH } from "@/lib/downloader";
import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathSegments } = await params;
  const filePath = pathSegments.join("/");
  if (!ARIA2_PATH) {
    return NextResponse.json(
      { error: "ARIA2_PATH not configured" },
      { status: 500 },
    );
  }

  const fullPath = path.join(ARIA2_PATH, filePath);

  // Check if MKV file was converted to MP4 - serve the MP4 instead
  let actualPath = fullPath;
  let actualExt = path.extname(fullPath).toLowerCase();

  if (actualExt === ".mkv") {
    const mp4Path = fullPath.replace(/\.mkv$/i, ".mp4");
    if (fs.existsSync(mp4Path)) {
      console.log(`[STREAM] Serving converted MP4 instead of MKV: ${filePath}`);
      actualPath = mp4Path;
      actualExt = ".mp4";
    }
  }

  if (!fs.existsSync(actualPath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const ext = actualExt;

  // Serve all video files directly with Range support
  // MKV/HEVC works natively in Edge and Safari, Chrome may need HEVC extension
  const stat = fs.statSync(actualPath);
  const fileSize = stat.size;
  const range = req.headers.get("range");

  // Set proper content type based on extension
  const mimeTypes: Record<string, string> = {
    ".mkv": "video/x-matroska",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".avi": "video/x-msvideo",
    ".mov": "video/quicktime",
  };
  const contentType = mimeTypes[ext] || "video/mp4";

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${fileSize}` },
      });
    }

    const chunksize = end - start + 1;
    const stream = fs.createReadStream(actualPath, { start, end });

    return new NextResponse(stream as any, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize.toString(),
        "Content-Type": contentType,
      },
    });
  } else {
    const stream = fs.createReadStream(actualPath);
    return new NextResponse(stream as any, {
      headers: {
        "Content-Length": fileSize.toString(),
        "Content-Type": contentType,
      },
    });
  }
}
