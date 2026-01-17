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

  if (!fs.existsSync(fullPath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const ext = path.extname(fullPath).toLowerCase();

  // MKV files are now served directly - modern browsers (Chrome, Firefox, Edge) support MKV playback
  // This preserves seeking, duration, and subtitle sync (unlike live transcoding)

  // Standardowy streaming z obsługą Range (dla MKV i MP4)
  const stat = fs.statSync(fullPath);
  const fileSize = stat.size;
  const range = req.headers.get("range");

  // Set proper content type
  const contentType = ext === ".mkv" ? "video/x-matroska" : "video/mp4";

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
    const stream = fs.createReadStream(fullPath, { start, end });

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
    const stream = fs.createReadStream(fullPath);
    return new NextResponse(stream as any, {
      headers: {
        "Content-Length": fileSize.toString(),
        "Content-Type": contentType,
      },
    });
  }
}
