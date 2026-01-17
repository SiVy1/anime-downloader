import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { promises as fsp } from "fs";
import os from "os";
import { ARIA2_PATH } from "./downloader";
import { FFprobeMetadata, FFprobeStream } from "./types/ffprobe";

export interface ConversionProgress {
  percent: number;
  currentTime?: number;
  duration?: number;
}

export interface ConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

// Track active conversions
const activeConversions = new Map<string, { progress: number; command: any }>();

/**
 * Get the MP4 path for an MKV file
 */
export function getMp4Path(mkvPath: string): string {
  return mkvPath.replace(/\.mkv$/i, ".mp4");
}

/**
 * Check if a converted MP4 version exists
 */
export async function hasConvertedVersion(mkvPath: string): Promise<boolean> {
  const mp4Path = getMp4Path(mkvPath);
  try {
    await fsp.access(mp4Path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get conversion progress for a file
 */
export function getConversionProgress(filePath: string): number | null {
  const conversion = activeConversions.get(filePath);
  return conversion ? conversion.progress : null;
}

/**
 * Convert MKV to MP4 for browser playback
 * Uses copy codec where possible for speed and quality preservation
 */
export async function convertMkvToMp4(
  relativePath: string,
  onProgress?: (progress: ConversionProgress) => void,
): Promise<ConversionResult> {
  if (!ARIA2_PATH) {
    return { success: false, error: "ARIA2_PATH not configured" };
  }

  const inputPath = path.join(ARIA2_PATH, relativePath);
  const outputPath = getMp4Path(inputPath);
  const tempPath = outputPath + ".temp";

  if (!fs.existsSync(inputPath)) {
    return { success: false, error: "Input file not found" };
  }

  // Check if already converted
  if (fs.existsSync(outputPath)) {
    return { success: true, outputPath };
  }

  // Check if conversion in progress
  if (activeConversions.has(inputPath)) {
    return { success: false, error: "Conversion already in progress" };
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  try {
    if (
      !(await fsp
        .access(outputDir)
        .then(() => true)
        .catch(() => false))
    ) {
      await fsp.mkdir(outputDir, { recursive: true });
    }
  } catch (err: any) {
    console.error(`[CONVERT DIR ERROR] ${err.message}`);
    return { success: false, error: `Cannot create directory: ${outputDir}` };
  }

  // Test read permission for input file
  try {
    await fsp.access(inputPath, fs.constants.R_OK);
  } catch (err: any) {
    console.error(
      `[CONVERT PERMISSION ERROR] Cannot read input file ${inputPath}: ${err.message}`,
    );
    return {
      success: false,
      error: `No read permission for file (root ownership?): ${path.basename(inputPath)}`,
    };
  }

  // Probe file for codecs
  const metadata: FFprobeMetadata | null = await new Promise<FFprobeMetadata>(
    (resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, data) => {
        if (err) reject(err);
        else resolve(data as FFprobeMetadata);
      });
    },
  ).catch((err) => {
    console.error("[CONVERT PROBE ERROR]", err);
    return null;
  });

  const videoStream: FFprobeStream | undefined = metadata?.streams?.find(
    (s) => s.codec_type === "video",
  );
  const audioStream: FFprobeStream | undefined = metadata?.streams?.find(
    (s) => s.codec_type === "audio",
  );

  const canCopyVideo = videoStream?.codec_name === "h264";
  const canCopyAudio = audioStream?.codec_name === "aac";

  const cpuCount = os.cpus().length;
  const threads = Math.max(1, cpuCount - 1);

  return new Promise((resolve) => {
    console.log(`[CONVERT] Input: ${inputPath}`);
    console.log(
      `[CONVERT] Video: ${canCopyVideo ? "COPY" : "TRANSCODE (libx264)"}`,
    );
    console.log(
      `[CONVERT] Audio: ${canCopyAudio ? "COPY" : "TRANSCODE (aac)"}`,
    );
    console.log(`[CONVERT] Threads: ${threads}`);

    const command = ffmpeg(inputPath)
      .format("mp4")
      .videoCodec(canCopyVideo ? "copy" : "libx264")
      .audioCodec(canCopyAudio ? "copy" : "aac")
      .outputOptions([
        `-threads ${threads}`,
        "-preset ultrafast",
        "-crf 23",
        "-movflags +faststart",
        "-map 0:v:0",
        "-map 0:a:0?",
        "-map 0:s?",
        "-c:s mov_text",
      ])
      .on("start", (commandLine) => {
        console.log(`[CONVERT] Command: ${commandLine}`);
        activeConversions.set(inputPath, { progress: 0, command });
      })
      .on("progress", (progress) => {
        const percent = progress.percent || 0;
        activeConversions.set(inputPath, { progress: percent, command });
        onProgress?.({
          percent,
          currentTime: progress.timemark
            ? parseTimemark(progress.timemark)
            : undefined,
        });
      })
      .on("error", (err) => {
        console.error(`[CONVERT ERROR] ${err.message}`);
        activeConversions.delete(inputPath);
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
        resolve({ success: false, error: err.message });
      })
      .on("end", async () => {
        console.log(`[CONVERT] Completed: ${relativePath}`);
        activeConversions.delete(inputPath);
        try {
          if (
            await fsp
              .access(tempPath)
              .then(() => true)
              .catch(() => false)
          ) {
            await fsp.rename(tempPath, outputPath);
          }
          if (
            await fsp
              .access(inputPath)
              .then(() => true)
              .catch(() => false)
          ) {
            await fsp.unlink(inputPath);
            console.log(`[CONVERT] Deleted original MKV: ${inputPath}`);
          }
        } catch (err) {
          console.error(`[CONVERT CLEANUP ERROR]`, err);
        }
        resolve({ success: true, outputPath });
      });

    command.save(tempPath);
  });
}

/**
 * Cancel an active conversion
 */
export function cancelConversion(filePath: string): boolean {
  const fullPath = ARIA2_PATH ? path.join(ARIA2_PATH, filePath) : filePath;
  const conversion = activeConversions.get(fullPath);
  if (conversion) {
    conversion.command.kill("SIGKILL");
    activeConversions.delete(fullPath);
    return true;
  }
  return false;
}

/**
 * Parse FFmpeg timemark (HH:MM:SS.ms) to seconds
 */
function parseTimemark(timemark: string): number {
  const parts = timemark.split(":");
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
}
