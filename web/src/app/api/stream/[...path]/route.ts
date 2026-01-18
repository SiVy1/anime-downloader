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

  const stat = fs.statSync(actualPath);
  const fileSize = stat.size;
  const range = req.headers.get("range");

  // Determine if we should serve directly or transcode
  // If it's already an MP4, we should almost always serve it directly with Range support
  const isMp4 = actualExt === ".mp4";

  if (isMp4) {
    // Set proper content type based on extension
    const contentType = "video/mp4";

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
          "Accept-Ranges": "bytes",
        },
      });
    }
  }

  // Fallback: Transcoding for MKV or unsupported formats
  const audioTrackIndex = req.nextUrl.searchParams.get("audioTrack") || "0";

  const passThrough = new PassThrough();
  const command = ffmpeg(actualPath)
    .format("mp4")
    .videoCodec("libx264")
    .audioCodec("aac")
    .outputOptions([
      "-preset ultrafast",
      "-tune zerolatency",
      "-movflags frag_keyframe+empty_moov+default_base_moof",
      "-map 0:v:0",
      `-map 0:a:${audioTrackIndex}?`,
      "-threads 0",
    ])

    .on("error", (err) => {
      console.error(`[TRANSCODE ERROR] ${err.message}`);
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

  return new Response(webStream as any, {
    headers: {
      "Content-Type": "video/mp4",
      "Transfer-Encoding": "chunked",
    },
  });
}
