import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { ARIA2_PATH } from "@/lib/downloader";
import ffmpeg from "fluent-ffmpeg";

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
          index: s.index, // FFmpeg internal index
          localIndex: index, // Index relative to other subtitle tracks
          codec: s.codec_name,
          language: s.tags?.language || "unknown",
          title: s.tags?.title || `Track ${index + 1}`,
          // ASS/SSA formats support styling - use JASSUB for these
          isASS: s.codec_name === "ass" || s.codec_name === "ssa",
        }));

      resolve(
        NextResponse.json({
          format: metadata.format.format_name,
          duration: metadata.format.duration,
          subtitles: subtitleTracks,
        }),
      );
    });
  });
}
