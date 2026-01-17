/**
 * Codec Detection and Browser Compatibility Utilities
 *
 * This module provides functions to:
 * 1. Detect video/audio codecs in a file using FFprobe
 * 2. Check if a browser can natively play specific codecs
 */

import { spawn } from "child_process";
import path from "path";

export interface MediaCodecInfo {
  video: {
    codec: string; // e.g., "h264", "hevc", "vp9", "av1"
    profile?: string;
    bitDepth?: number;
    width?: number;
    height?: number;
  } | null;
  audio: {
    codec: string; // e.g., "aac", "ac3", "dts", "opus", "flac"
    channels?: number;
    sampleRate?: number;
  } | null;
  container: string; // e.g., "matroska", "mp4", "webm"
  canDirectPlay: boolean; // Whether most browsers can play this natively
  recommendedStream: "direct" | "transcode";
}

// Codecs that most modern browsers support natively
const BROWSER_SUPPORTED_VIDEO_CODECS = new Set([
  "h264",
  "avc1",
  "vp8",
  "vp9",
  "av1", // Chrome 70+, Firefox 67+
]);

const BROWSER_SUPPORTED_AUDIO_CODECS = new Set([
  "aac",
  "mp3",
  "opus",
  "vorbis",
  "flac", // Chrome 56+
]);

// HEVC is supported on Safari, iPhone, and some Android devices
// We'll be conservative and require transcoding for it on web
const HEVC_CODECS = new Set(["hevc", "h265", "hvc1", "hev1"]);

/**
 * Get codec information from a video file using FFprobe
 */
export async function getMediaCodecs(
  filePath: string,
): Promise<MediaCodecInfo> {
  return new Promise((resolve) => {
    const ffprobe = spawn("ffprobe", [
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      filePath,
    ]);

    let output = "";
    let error = "";

    ffprobe.stdout.on("data", (data) => {
      output += data.toString();
    });

    ffprobe.stderr.on("data", (data) => {
      error += data.toString();
    });

    ffprobe.on("close", (code) => {
      if (code !== 0 || !output) {
        console.error("[Codec Detection] FFprobe error:", error);
        resolve({
          video: null,
          audio: null,
          container: "unknown",
          canDirectPlay: false,
          recommendedStream: "transcode",
        });
        return;
      }

      try {
        const data = JSON.parse(output);
        const videoStream = data.streams?.find(
          (s: any) => s.codec_type === "video",
        );
        const audioStream = data.streams?.find(
          (s: any) => s.codec_type === "audio",
        );
        const format = data.format?.format_name || "unknown";

        const videoCodec = videoStream?.codec_name?.toLowerCase() || null;
        const audioCodec = audioStream?.codec_name?.toLowerCase() || null;

        // Determine if direct play is possible
        const videoSupported =
          videoCodec && BROWSER_SUPPORTED_VIDEO_CODECS.has(videoCodec);
        const audioSupported =
          audioCodec && BROWSER_SUPPORTED_AUDIO_CODECS.has(audioCodec);

        // MKV container is not natively supported, but MP4/WebM are
        const containerSupported =
          format.includes("mp4") ||
          format.includes("webm") ||
          format.includes("mov");

        // For MKV with H.264+AAC, some browsers can still play it
        // But for safety, we recommend transcoding unless it's already in a good container
        const canDirectPlay =
          videoSupported && audioSupported && containerSupported;

        // Special case: H.264 + AAC in MKV might work with some browsers
        // We can try direct first and fallback to transcode
        const h264InMkv =
          videoCodec === "h264" &&
          audioCodec === "aac" &&
          format.includes("matroska");

        resolve({
          video: videoStream
            ? {
                codec: videoCodec || "unknown",
                profile: videoStream.profile,
                bitDepth: videoStream.bits_per_raw_sample
                  ? parseInt(videoStream.bits_per_raw_sample)
                  : undefined,
                width: videoStream.width,
                height: videoStream.height,
              }
            : null,
          audio: audioStream
            ? {
                codec: audioCodec || "unknown",
                channels: audioStream.channels,
                sampleRate: audioStream.sample_rate
                  ? parseInt(audioStream.sample_rate)
                  : undefined,
              }
            : null,
          container: format.split(",")[0],
          canDirectPlay: canDirectPlay || h264InMkv,
          recommendedStream:
            canDirectPlay || h264InMkv ? "direct" : "transcode",
        });
      } catch (e) {
        console.error("[Codec Detection] Parse error:", e);
        resolve({
          video: null,
          audio: null,
          container: "unknown",
          canDirectPlay: false,
          recommendedStream: "transcode",
        });
      }
    });
  });
}

/**
 * Check if HEVC is supported (for informational purposes)
 * HEVC requires special handling - supported on Safari/iOS but not Chrome/Firefox
 */
export function isHEVC(codec: string): boolean {
  return HEVC_CODECS.has(codec.toLowerCase());
}

/**
 * Get a human-readable codec description
 */
export function getCodecDescription(info: MediaCodecInfo): string {
  const video = info.video?.codec.toUpperCase() || "Unknown";
  const audio = info.audio?.codec.toUpperCase() || "Unknown";
  const resolution =
    info.video?.width && info.video?.height
      ? `${info.video.width}x${info.video.height}`
      : "";

  return `${video}/${audio} ${resolution}`.trim();
}
