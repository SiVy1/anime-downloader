import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { ARIA2_PATH } from "@/lib/downloader";
import ffmpeg from "fluent-ffmpeg";

// Browser-supported codecs for direct playback
const BROWSER_VIDEO_CODECS = new Set(["h264", "vp8", "vp9", "av1"]);
const BROWSER_AUDIO_CODECS = new Set(["aac", "mp3", "opus", "vorbis", "flac"]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
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

  return new Promise<NextResponse>((resolve) => {
    ffmpeg.ffprobe(fullPath, (err, metadata) => {
      if (err) {
        console.error("FFprobe error:", err);
        return resolve(
          NextResponse.json({ error: "Failed to probe file" }, { status: 500 }),
        );
      }

      const subtitleTracks = metadata.streams
        .filter((s) => s.codec_type === "subtitle")
        .map((s, index) => ({
          index: s.index,
          localIndex: index,
          codec: s.codec_name,
          language: s.tags?.language || "unknown",
          title: s.tags?.title || `Track ${index + 1}`,
          isASS: s.codec_name === "ass" || s.codec_name === "ssa",
        }));

      // Get video/audio codec info for smart streaming
      const videoStream = metadata.streams.find(
        (s) => s.codec_type === "video",
      );
      const audioStream = metadata.streams.find(
        (s) => s.codec_type === "audio",
      );

      const videoCodec = videoStream?.codec_name?.toLowerCase() || null;
      const audioCodec = audioStream?.codec_name?.toLowerCase() || null;
      const container = metadata.format.format_name?.split(",")[0] || "unknown";

      // Determine if direct play is possible
      const videoSupported = videoCodec && BROWSER_VIDEO_CODECS.has(videoCodec);
      const audioSupported = audioCodec && BROWSER_AUDIO_CODECS.has(audioCodec);
      const containerSupported =
        container.includes("mp4") || container.includes("webm");

      // H.264 + AAC in MKV might work on some browsers (Safari, iPhone)
      const h264InMkv = videoCodec === "h264" && audioCodec === "aac";
      const canDirectPlay =
        (videoSupported && audioSupported && containerSupported) || h264InMkv;

      resolve(
        NextResponse.json({
          format: metadata.format.format_name,
          duration: metadata.format.duration,
          subtitles: subtitleTracks,
          // New codec info for smart streaming
          codecs: {
            video: videoCodec,
            audio: audioCodec,
            container,
            width: videoStream?.width,
            height: videoStream?.height,
            canDirectPlay,
            recommendedStream: canDirectPlay ? "direct" : "transcode",
          },
        }),
      );
    });
  });
}
