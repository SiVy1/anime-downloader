import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { promises as fsp } from "fs";
import path from "path";
import { ARIA2_PATH } from "@/lib/downloader";

/**
 * Direct Stream API - Serves video files directly without transcoding
 * Used when the browser natively supports the video/audio codecs
 *
 * Supports HTTP Range requests for seeking
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathParts } = await params;
  console.log("[StreamDirect] Raw path parts:", pathParts);

  if (!ARIA2_PATH || pathParts.length < 2) {
    console.error("[StreamDirect] Invalid request or ARIA2_PATH missing");
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const folder = decodeURIComponent(pathParts[0]);
  const filename = decodeURIComponent(pathParts.slice(1).join("/"));
  const fullPath = path.join(ARIA2_PATH, folder, filename);

  console.log("[StreamDirect] Decoded folder:", folder);
  console.log("[StreamDirect] Decoded filename:", filename);
  console.log("[StreamDirect] Constructed ARIA2_PATH:", ARIA2_PATH);
  console.log("[StreamDirect] Attempting to serve:", fullPath);

  if (!fs.existsSync(fullPath)) {
    console.error("[StreamDirect] File not found at path:", fullPath);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const stat = fs.statSync(fullPath);
  const fileSize = stat.size;
  const ext = path.extname(filename).toLowerCase();

  // Determine MIME type
  const mimeTypes: Record<string, string> = {
    ".mp4": "video/mp4",
    ".mkv": "video/x-matroska",
    ".webm": "video/webm",
    ".avi": "video/x-msvideo",
    ".mov": "video/quicktime",
  };
  const contentType = mimeTypes[ext] || "video/mp4";

  // Handle Range requests for seeking
  const range = req.headers.get("range");

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const stream = fs.createReadStream(fullPath, { start, end });

    return new Response(stream as any, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // No range - return full file
  const stream = fs.createReadStream(fullPath);

  return new Response(stream as any, {
    status: 200,
    headers: {
      "Content-Length": String(fileSize),
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
