import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ARIA2_PATH } from "@/lib/downloader";
import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";

/**
 * Enhanced Live Stream API
 *
 * Strategy:
 * 1. For H.264 files: Serve directly with Range support.
 *    - This allows perfect seeking and timeline display in the browser.
 * 2. For other formats (HEVC, etc.): Transcode to H.264.
 *    - Uses fragmented MP4 for live delivery. Seeking is limited in this mode.
 */
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

  // Get current file size (important for range requests)
  const stat = fs.statSync(fullPath);
  const currentSize = stat.size;

  // Use ffprobe to detect if we can stream directly
  const metadata: any = await new Promise((resolve) => {
    ffmpeg.ffprobe(fullPath, (err, data) => {
      if (err) resolve(null);
      else resolve(data);
    });
  });

  const videoStream = metadata?.streams?.find(
    (s: any) => s.codec_type === "video",
  );

  // H.264 can usually be played directly by most browsers even in MKV containers
  // Direct streaming via Range requests is the ONLY way to get proper seeking for growing files.
  const isH264 = videoStream?.codec_name === "h264";
  const ext = path.extname(fullPath).toLowerCase();

  // Strategy: If it's H.264, use Direct Range Stream (Seeking WORKS)
  if (isH264) {
    const range = req.headers.get("range");
    const contentType = ext === ".mkv" ? "video/x-matroska" : "video/mp4";

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const requestedStart = parseInt(parts[0], 10);

      // Clamp to available data (32KB safety buffer for growing files)
      const safeSize = Math.max(0, currentSize - 32768);
      const start = Math.min(requestedStart, safeSize);
      const requestedEnd = parts[1] ? parseInt(parts[1], 10) : safeSize;
      const end = Math.min(requestedEnd, safeSize);

      if (start >= currentSize || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${currentSize}` },
        });
      }

      const chunkSize = end - start + 1;
      const stream = fs.createReadStream(fullPath, { start, end });

      return new Response(stream as any, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${currentSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": "video/mp4", // Browser treats it as MP4 even if MKV for better compatibility
          "Cache-Control": "no-cache",
          "X-Stream-Method": "direct-range",
        },
      });
    }

    // Default: serve initial chunk
    const initialSize = Math.min(1024 * 1024 * 2, currentSize);
    const stream = fs.createReadStream(fullPath, {
      start: 0,
      end: initialSize,
    });
    return new Response(stream as any, {
      status: 206,
      headers: {
        "Content-Range": `bytes 0-${initialSize}/${currentSize}`,
        "Accept-Ranges": "bytes",
        "Content-Type": "video/mp4",
        "Cache-Control": "no-cache",
      },
    });
  }

  // Strategy: Non-H.264 (HEVC, etc.) - Must Transcode (Seeking LIMITED)
  const passThrough = new PassThrough();
  const command = ffmpeg(fullPath)
    .format("mp4")
    .videoCodec("libx264")
    .outputOptions([
      "-preset ultrafast",
      "-tune zerolatency",
      "-crf 23",
      "-maxrate 3M",
      "-bufsize 6M",
      "-movflags frag_keyframe+empty_moov+default_base_moof",
      "-map 0:v:0",
      "-map 0:a:0?",
      "-c:a aac",
      "-ac 2",
    ])
    .on("error", (err) => {
      console.error(`[LIVE-STREAM] FFmpeg Error: ${err.message}`);
      passThrough.end();
    });

  command.pipe(passThrough, { end: true });

  return new NextResponse(passThrough as any, {
    headers: {
      "Content-Type": "video/mp4",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Transfer-Encoding": "chunked",
      "X-Stream-Method": "transcode-live",
    },
  });
}
