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

  // Get metadata using ffprobe to decide strategy
  const metadata: any = await new Promise((resolve) => {
    ffmpeg.ffprobe(fullPath, (err, data) => {
      if (err) resolve(null);
      else resolve(data);
    });
  });

  const videoStream = metadata?.streams?.find(
    (s: any) => s.codec_type === "video",
  );
  const isH264 = videoStream?.codec_name === "h264";

  // Create a PassThrough stream for the response
  const passThrough = new PassThrough();

  // FFmpeg command setup based on PDF guidelines
  const command = ffmpeg(fullPath)
    .format("mp4")
    // Use copy for H.264, transcode for anything else (HEVC, etc.)
    .videoCodec(isH264 ? "copy" : "libx264")
    // PDF SCENARIO 2: Optimized for CPU-only VPS
    .outputOptions([
      "-preset ultrafast",
      "-tune zerolatency",
      "-crf 23",
      "-maxrate 3M",
      "-bufsize 6M",
      "-movflags frag_keyframe+empty_moov+default_base_moof",
      "-map 0:v:0",
      "-map 0:a:0?", // Take first audio track
      "-c:a aac", // Always convert audio to AAC for browser compatibility
      "-ac 2", // Downmix to 2 channels
    ])
    .on("start", (cmd) => {
      console.log(`[LIVE-STREAM] Started FFmpeg: ${cmd}`);
    })
    .on("error", (err) => {
      console.error(`[LIVE-STREAM] FFmpeg Error: ${err.message}`);
      passThrough.end();
    });

  // Pipe result to our PassThrough stream
  command.pipe(passThrough, { end: true });

  // Return the stream as response
  // We don't set Content-Length because it's a dynamic stream
  return new NextResponse(passThrough as any, {
    headers: {
      "Content-Type": "video/mp4",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Transfer-Encoding": "chunked",
    },
  });
}
