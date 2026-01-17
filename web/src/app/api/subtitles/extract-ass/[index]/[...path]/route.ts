import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { ARIA2_PATH } from "@/lib/downloader";
import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";

/**
 * GET /api/subtitles/extract-ass/[index]/[...path]
 *
 * Extract raw ASS/SSA subtitles from video file without conversion.
 * Preserves all styling information (fonts, colors, positioning, karaoke effects).
 *
 * Unlike the VTT extraction endpoint, this returns the original ASS format
 * for use with JASSUB renderer.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ index: string; path: string[] }> },
) {
  const { index, path: pathSegments } = await params;
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

  const passThrough = new PassThrough();

  // FFmpeg extraction to raw ASS format (preserves styling)
  // index is the subtitle track number (0, 1, 2...)
  const command = ffmpeg(fullPath)
    .outputOptions([`-map 0:s:${index}`, "-f ass"])
    .on("error", (err) => {
      console.error(`[ASS EXTRACTION ERROR] ${err.message}`);
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

  return new NextResponse(webStream as unknown as BodyInit, {
    headers: {
      "Content-Type": "text/x-ssa",
      "Cache-Control": "max-age=3600",
    },
  });
}
