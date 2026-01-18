import React, { useState } from "react";
import {
  Star,
  CheckCircle2,
  Info,
  Disc,
  Settings,
  RefreshCw,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PlayerInfoProps {
  currentFile: string | null;
  animeInfo: any;
  loadingInfo: boolean;
  isWatched: boolean;
  onToggleWatched: () => void;
  isConverting: boolean;
  convertProgress: number;
  isConverted: boolean;
  onStartConversion: () => void;
}

export const PlayerInfo: React.FC<PlayerInfoProps> = ({
  currentFile,
  animeInfo,
  loadingInfo,
  isWatched,
  onToggleWatched,
  isConverting,
  convertProgress,
  isConverted,
  onStartConversion,
}) => {
  const [showTechnical, setShowTechnical] = useState(false);

  const isHEVC =
    currentFile?.toLowerCase().includes("hevc") ||
    currentFile?.toLowerCase().includes("x265");

  return (
    <div className="mt-8 space-y-4">
      {/* Main Consolidated Header */}
      <div className="bg-white/[0.02] rounded-3xl p-6 border border-white/5 backdrop-blur-3xl shadow-xl">
        {loadingInfo ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-white/10 rounded-xl w-1/3" />
            <div className="h-4 bg-white/5 rounded-lg w-full" />
          </div>
        ) : animeInfo ? (
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                  {animeInfo.title}
                </h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-black text-yellow-500">
                    {animeInfo.score || "N/A"}
                  </span>
                </div>
                <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                    {animeInfo.status || "Nieznany"}
                  </span>
                </div>
                {animeInfo.episodes && (
                  <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      {animeInfo.episodes} Odcinków
                    </span>
                  </div>
                )}
              </div>
              <p className="text-white/40 text-sm leading-relaxed line-clamp-2 max-w-3xl font-medium">
                {animeInfo.synopsis || "Brak opisu tego tytułu."}
              </p>
              <div className="flex flex-wrap gap-2">
                {(animeInfo.genres || []).slice(0, 5).map((genre: any) => (
                  <span
                    key={genre.name}
                    className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/30"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 min-w-[200px]">
              <button
                onClick={onToggleWatched}
                disabled={!currentFile}
                className={`w-full h-12 rounded-2xl border flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all group ${
                  isWatched
                    ? "bg-green-500/10 border-green-500/20 text-green-500 shadow-lg shadow-green-500/5 hover:bg-green-500/20"
                    : "bg-white/5 border-white/10 hover:bg-white/10 text-white/40 hover:text-white"
                }`}
              >
                <CheckCircle2
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${isWatched ? "fill-green-500/20" : ""}`}
                />
                {isWatched ? "Obejrzano" : "Zaznacz obejrzenie"}
              </button>

              <button
                onClick={() => setShowTechnical(!showTechnical)}
                className="w-full h-12 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-white/30 hover:text-white/60 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
              >
                <Settings className="w-3.5 h-3.5" />
                {showTechnical ? "Ukryj techniczne" : "Dane techniczne"}
                {showTechnical ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 opacity-20 py-4">
            <Info className="w-8 h-8" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">
              Brak Meta-danych
            </p>
          </div>
        )}
      </div>

      {/* Collapsible Technical Details */}
      <AnimatePresence>
        {showTechnical && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
              {/* File Details */}
              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/5">
                <h3 className="text-xs font-black mb-4 flex items-center gap-3 italic uppercase tracking-widest text-blue-400">
                  <Disc className="w-4 h-4" />
                  Plik Lokalny
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20">
                      Nazwa
                    </span>
                    <span className="text-[10px] font-bold text-white/60 truncate ml-4 max-w-[200px]">
                      {currentFile?.split("/").pop()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20">
                      Format
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] font-black rounded border border-blue-500/20 uppercase">
                        {currentFile?.split(".").pop()}
                      </span>
                      {isHEVC && (
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[9px] font-black rounded border border-purple-500/20 uppercase">
                          HEVC
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stream Engine Information */}
              <div className="bg-gradient-to-br from-blue-600/[0.05] to-transparent rounded-2xl p-6 border border-blue-500/10">
                <h3 className="text-xs font-black mb-4 flex items-center gap-3 italic uppercase tracking-widest text-white/60">
                  <Zap className="w-4 h-4 text-blue-500" />
                  Technologia
                </h3>

                {currentFile?.toLowerCase().endsWith(".mkv") ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-tight text-white/80">
                          Konwersja MKV &rarr; MP4
                        </h4>
                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-1">
                          {isHEVC ? "Transkodowanie" : "Remux"}
                        </p>
                      </div>
                      {isConverted && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20">
                          Gotowe
                        </span>
                      )}
                    </div>

                    {isConverting ? (
                      <div className="space-y-2">
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${convertProgress}%` }}
                            className="h-full bg-blue-500"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
                          <span className="text-[10px] font-black italic text-blue-500">
                            {Math.round(convertProgress)}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      !isConverted && (
                        <button
                          onClick={onStartConversion}
                          className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Przetwarzaj
                        </button>
                      )
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 py-2 opacity-30">
                    <Zap className="w-6 h-6 text-green-500/50" />
                    <p className="text-[9px] font-black uppercase tracking-widest">
                      Obsługiwane bezpośrednio
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
    </div>
  );
};
