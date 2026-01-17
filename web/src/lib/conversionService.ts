import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { ARIA2_PATH } from "./downloader";

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
export function hasConvertedVersion(mkvPath: string): boolean {
  const mp4Path = getMp4Path(mkvPath);
  return fs.existsSync(mp4Path);
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

  return new Promise((resolve) => {
    console.log(`[CONVERT] Starting conversion: ${relativePath}`);

    const command = ffmpeg(inputPath)
      .format("mp4")
      // Try to copy video codec if H.264, otherwise re-encode
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions([
        "-preset fast", // Balance between speed and compression
        "-crf 20", // High quality
        "-movflags +faststart", // Web optimization
        "-map 0:v:0", // First video stream
        "-map 0:a:0?", // First audio stream (optional)
        "-map 0:s?", // All subtitle streams (optional)
        "-c:s mov_text", // Convert subtitles to mp4-compatible format
      ])
      .on("start", () => {
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
        // Clean up temp file
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
        resolve({ success: false, error: err.message });
      })
      .on("end", () => {
        console.log(`[CONVERT] Completed: ${relativePath}`);
        activeConversions.delete(inputPath);
        // Rename temp to final
        if (fs.existsSync(tempPath)) {
          fs.renameSync(tempPath, outputPath);
        }
        // Delete original MKV file to save disk space
        if (fs.existsSync(inputPath)) {
          fs.unlinkSync(inputPath);
          console.log(`[CONVERT] Deleted original MKV: ${inputPath}`);
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
