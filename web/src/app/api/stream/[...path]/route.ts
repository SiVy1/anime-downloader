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

  // Jeśli to MKV, używamy FFmpega do transkodowania w locie
  if (ext === ".mkv") {
    console.log(`[STREAM] Transkodowanie MKV w locie: ${filePath}`);

    const passThrough = new PassThrough();
    const command = ffmpeg(fullPath)
      .format("mp4")
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions([
        "-movflags frag_keyframe+empty_moov", // Pozwala na streaming MP4 bez moov atom na początku
        "-preset ultrafast", // Szybkie kodowanie, mniejsze obciążenie CPU
        "-crf 23", // Akceptowalna jakość
      ])
      .on("error", (err) => {
        console.error(`[FFMPEG ERROR] ${err.message}`);
        passThrough.destroy();
      });

    command.pipe(passThrough, { end: true });

    // Konwersja Node Stream na Web Stream (NextResponse)
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
        "Content-Type": "video/mp4",
        "Cache-Control": "no-cache",
      },
    });
  }

  // Standardowy streaming dla MP4 (z obsługą Range)
  const stat = fs.statSync(fullPath);
  const fileSize = stat.size;
  const range = req.headers.get("range");

  const contentType = ext === ".mp4" ? "video/mp4" : "video/x-matroska";

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
