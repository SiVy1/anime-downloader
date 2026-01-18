import React, { useState } from "react";
import {
  Search,
  ArrowLeft,
  Subtitles,
  Download,
  Clock,
  Plus,
  Minus,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SubtitleModalProps {
  subtitles: any[];
  isSearching: boolean;
  onSelect: (sub: any) => void;
  onClose: () => void;
  onOffsetChange?: (offset: number) => void;
  currentOffset?: number;
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

export const SubtitleModal: React.FC<SubtitleModalProps> = ({
  subtitles,
  isSearching,
  onSelect,
  onClose,
  onOffsetChange,
  currentOffset = 0,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-8 border-b border-white/5 bg-[#121212]/50">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-black flex items-center gap-3 italic uppercase tracking-tighter">
                <Subtitles className="w-8 h-8 text-blue-500" />
                Napisy
              </h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mt-1">
                Synchronizacja i wybór źródła
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all group"
            >
              <ArrowLeft className="w-6 h-6 opacity-40 group-hover:opacity-100 rotate-180 group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          {/* Sync Controls */}
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-3xl border border-white/5">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">
                Offset (Synchronizacja)
              </p>
              <div className="flex items-center gap-4">
                <span className="text-xl font-black italic w-16 text-blue-400">
                  {currentOffset > 0
                    ? `+${currentOffset.toFixed(1)}s`
                    : `${currentOffset.toFixed(1)}s`}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onOffsetChange?.(currentOffset - 0.5)}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOffsetChange?.(currentOffset + 0.5)}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOffsetChange?.(0)}
                    className="px-4 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest flex items-center justify-center transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {isSearching ? (
            [...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-white/5 rounded-3xl animate-pulse"
              />
            ))
          ) : subtitles.length > 0 ? (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {subtitles.map((sub) => {
                const isSelected = selectedId === sub.id;
                return (
                  <motion.button
                    key={sub.id}
                    variants={item}
                    onClick={() => {
                      setSelectedId(sub.id);
                      onSelect(sub);
                    }}
                    className={`w-full flex items-center gap-5 p-5 rounded-3xl border transition-all group text-left relative overflow-hidden ${
                      isSelected
                        ? "bg-blue-600 border-blue-400 shadow-[0_10px_30px_rgba(37,99,235,0.3)]"
                        : "bg-[#151515] hover:bg-[#1a1a1a] border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-white text-blue-600"
                          : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <Subtitles className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-black uppercase tracking-tight truncate ${isSelected ? "text-white" : "text-white/90"}`}
                      >
                        {sub.attributes.release ||
                          sub.attributes.feature_details?.title ||
                          "Napisy"}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] font-black uppercase tracking-widest">
                        <span
                          className={`px-2 py-0.5 rounded-lg ring-1 ${
                            isSelected
                              ? "bg-white/20 text-white ring-white/30"
                              : sub.attributes.language === "pl"
                                ? "bg-red-600/10 text-red-500 ring-red-500/20"
                                : "bg-blue-600/10 text-blue-500 ring-blue-500/20"
                          }`}
                        >
                          {(sub.attributes.language || "en").toUpperCase()}
                        </span>
                        {sub.attributes.source && (
                          <span
                            className={
                              isSelected ? "text-white/60" : "text-white/30"
                            }
                          >
                            {sub.attributes.source}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-white/20"
                          : "bg-white/5 text-white/20 group-hover:text-blue-500"
                      }`}
                    >
                      <Download className="w-5 h-5 mx-auto" />
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center">
              <Search className="w-16 h-16 mb-6" />
              <p className="text-sm font-black uppercase tracking-[0.2em]">
                Brak wyników
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
