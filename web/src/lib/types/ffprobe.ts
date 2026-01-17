/**
 * Type definitions for FFprobe output.
 * Used by conversionService and codecDetection.
 */

/** FFprobe stream information */
export interface FFprobeStream {
  codec_type: "video" | "audio" | "subtitle" | "data";
  codec_name: string;
  profile?: string;
  bits_per_raw_sample?: string;
  width?: number;
  height?: number;
  channels?: number;
  sample_rate?: string;
  index: number;
}

/** FFprobe format information */
export interface FFprobeFormat {
  format_name: string;
  duration?: string;
  size?: string;
  bit_rate?: string;
}

/** Complete FFprobe metadata output */
export interface FFprobeMetadata {
  streams: FFprobeStream[];
  format: FFprobeFormat;
}
