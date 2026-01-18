import React from "react";
import { Volume2, Check } from "lucide-react";
import { motion } from "framer-motion";

interface AudioTrack {
  index: number;
  localIndex: number;
  codec: string;
  language: string;
  title: string;
  channels: number;
  sampleRate: string;
  default: boolean;
}

interface AudioTrackSelectorProps {
  audioTracks: AudioTrack[];
  activeTrack: number;
  onSelect: (trackIndex: number) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
};

/**
 * AudioTrackSelector - Dropdown/popover for selecting audio tracks
 *
 * Displays all available audio tracks from an MKV file with:
 * - Language code
 * - Track title (e.g., "Japanese 5.1", "English Stereo")
 * - Channel count
 * - Active selection indicator
 */
export const AudioTrackSelector: React.FC<AudioTrackSelectorProps> = ({
  audioTracks,
  activeTrack,
  onSelect,
}) => {
  if (audioTracks.length <= 1) {
    return null; // Don't show selector for single-track files
  }

  const getChannelLabel = (channels: number): string => {
    switch (channels) {
      case 1:
        return "Mono";
      case 2:
        return "Stereo";
      case 6:
        return "5.1";
      case 8:
        return "7.1";
      default:
        return `${channels}ch`;
    }
  };

  const getLanguageLabel = (lang: string): string => {
    const langMap: Record<string, string> = {
      jpn: "Japanese",
      jap: "Japanese",
      ja: "Japanese",
      eng: "English",
      en: "English",
      pol: "Polish",
      pl: "Polish",
      und: "Unknown",
      unknown: "Unknown",
    };
    return langMap[lang.toLowerCase()] || lang.toUpperCase();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-1">
        <Volume2 className="w-3.5 h-3.5" />
        Audio Track
      </div>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-1"
      >
        {audioTracks.map((track) => {
          const isActive = track.localIndex === activeTrack;
          return (
            <motion.button
              key={track.index}
              variants={item}
              onClick={() => onSelect(track.localIndex)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "bg-white/5 hover:bg-white/10 text-white/80"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  isActive ? "bg-white/20" : "bg-white/5"
                }`}
              >
                {isActive ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span>{track.localIndex + 1}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">
                  {track.title !== `Audio ${track.localIndex + 1}`
                    ? track.title
                    : getLanguageLabel(track.language)}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider opacity-60">
                  <span
                    className={`px-1.5 py-0.5 rounded ${
                      isActive ? "bg-white/20" : "bg-white/10"
                    }`}
                  >
                    {track.language.toUpperCase()}
                  </span>
                  <span>{getChannelLabel(track.channels)}</span>
                  <span className="opacity-50">{track.codec.toUpperCase()}</span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};
