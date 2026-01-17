import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { ARIA2_PATH } from "@/lib/downloader";
import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ index: string; path: string[] }> },
) {
  const { index, path: pathSegments } = await params;
  console.log("[SubExtract] Raw path segments:", pathSegments);

  const filePath = pathSegments.map((p) => decodeURIComponent(p)).join("/");

  console.log("[SubExtract] Decoded relative path:", filePath);

  if (!ARIA2_PATH) {
    console.error("[SubExtract] ARIA2_PATH not configured");
    return NextResponse.json(
      { error: "ARIA2_PATH not configured" },
      { status: 500 },
    );
  }

  const fullPath = path.join(ARIA2_PATH, filePath);
  console.log("[SubExtract] Full system path:", fullPath);

  if (!fs.existsSync(fullPath)) {
    console.error("[SubExtract] File does not exist:", fullPath);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const passThrough = new PassThrough();

  console.log(`[SUBTITLE EXTRACT] Extracting track ${index} from: ${fullPath}`);

  // FFmpeg extraction to VTT
  // index tutaj to numer ścieżki napisów (0, 1, 2...)
  const command = ffmpeg(fullPath)
    .outputOptions([`-map 0:s:${index}`, "-f webvtt"])
    .on("error", (err) => {
      console.error(`[SUBTITLE EXTRACTION ERROR] ${err.message}`);
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

  return new NextResponse(webStream as any, {
    headers: {
      "Content-Type": "text/vtt",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
