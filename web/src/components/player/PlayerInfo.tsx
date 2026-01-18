import React from "react";
import {
  Star,
  Users,
  CheckCircle2,
  Info,
  Disc,
  Settings,
  RefreshCw,
  Zap,
  Clock,
  Layout,
  Gauge,
} from "lucide-react";
import { motion } from "framer-motion";

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
  const isHEVC =
    currentFile?.toLowerCase().includes("hevc") ||
    currentFile?.toLowerCase().includes("x265");

  return (
    <div className="mt-12 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Metadata Panel */}
        <div className="lg:col-span-2 bg-white/[0.02] rounded-[2.5rem] p-10 border border-white/5 backdrop-blur-3xl relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <Layout className="w-40 h-40 rotate-12" />
          </div>

          {loadingInfo ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-10 bg-white/10 rounded-2xl w-1/3" />
              <div className="space-y-3">
                <div className="h-4 bg-white/5 rounded-xl w-full" />
                <div className="h-4 bg-white/5 rounded-xl w-5/6" />
                <div className="h-4 bg-white/5 rounded-xl w-4/6" />
              </div>
            </div>
          ) : animeInfo ? (
            <>
              <div className="flex flex-wrap items-center gap-6 mb-6">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                  {animeInfo.title}
                </h2>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full shadow-lg shadow-yellow-500/5">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-black text-yellow-500">
                    {animeInfo.score || "N/A"}
                  </span>
                </div>
              </div>
              <p className="text-white/50 text-base leading-relaxed line-clamp-4 max-w-2xl font-medium">
                {animeInfo.synopsis || "Brak opisu tego tytułu."}
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                {(animeInfo.genres || []).map((genre: any) => (
                  <span
                    key={genre.name}
                    className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:bg-white/10 hover:text-white transition-all cursor-default"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 opacity-20">
              <Info className="w-16 h-16 mb-6" />
              <p className="text-sm font-black uppercase tracking-[0.3em]">
                Brak Meta-danych
              </p>
            </div>
          )}
        </div>

        {/* Quick Status Panel */}
        <div className="bg-gradient-to-br from-blue-600/10 to-transparent rounded-[2.5rem] p-10 border border-blue-500/10 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center gap-5 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/10">
                <Gauge className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/60 mb-1">
                  Status Produkcji
                </p>
                <p className="text-lg font-black uppercase tracking-tight text-white/90">
                  {animeInfo?.status || "Nieznany"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  Liczba Odcinków
                </span>
                <span className="text-2xl font-black italic text-white leading-none">
                  {animeInfo?.episodes || "??"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onToggleWatched}
            disabled={!currentFile}
            className={`mt-8 w-full h-16 rounded-[1.25rem] border flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all group ${
              isWatched
                ? "bg-green-500/20 border-green-500/30 text-green-500 shadow-lg shadow-green-500/5 hover:bg-green-500/30"
                : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60 hover:text-white"
            }`}
          >
            <CheckCircle2
              className={`w-5 h-5 transition-transform group-hover:scale-110 ${isWatched ? "fill-green-500/20" : ""}`}
            />
            {isWatched ? "Oznaczono jako obejrzane" : "Zaznacz obejrzenie"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* File Details */}
        <div className="bg-white/[0.02] rounded-[2.5rem] p-8 sm:p-10 border border-white/5 backdrop-blur-3xl shadow-xl">
          <h2 className="text-xl font-black mb-8 flex items-center gap-4 italic uppercase tracking-tighter text-blue-400">
            <Disc className="w-6 h-6" />
            Szczegóły Pliku Lokalnego
          </h2>
          <div className="space-y-6">
            <div className="flex justify-between items-center py-4 border-b border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                Nazwa pliku
              </span>
              <span className="text-sm font-bold text-white/80 truncate ml-8 max-w-[250px]">
                {currentFile?.split("/").pop()}
              </span>
            </div>
            <div className="flex justify-between items-center py-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                Format wideo
              </span>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded-lg ring-1 ring-blue-500/20 uppercase tracking-widest">
                  {currentFile?.split(".").pop()}
                </span>
                {isHEVC && (
                  <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-black rounded-lg ring-1 ring-purple-500/20 uppercase tracking-widest">
                    HEVC
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stream Engine Information */}
        <div className="bg-gradient-to-br from-blue-600/[0.07] to-transparent rounded-[2.5rem] p-8 sm:p-10 border border-blue-500/10 shadow-xl relative overflow-hidden">
          <h2 className="text-xl font-black mb-8 flex items-center gap-4 italic uppercase tracking-tighter text-white">
            <Settings className="w-6 h-6 text-blue-500" />
            Technologia Streamingu
          </h2>

          {currentFile?.toLowerCase().endsWith(".mkv") && (
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-6 relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-white/90">
                    Konwersja MKV &rarr; MP4
                  </h4>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1 flex items-center gap-2">
                    {isHEVC ? (
                      <>
                        <Clock className="w-3 h-3 text-yellow-500/50" />{" "}
                        Głębokie przeliczanie (Transkodowanie)
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 text-green-500/50" />{" "}
                        Błyskawiczna zmiana formatu (Remux)
                      </>
                    )}
                  </p>
                </div>
                {isConverted && (
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-400 bg-green-400/10 px-4 py-2 rounded-xl ring-1 ring-green-400/20">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Gotowe do gry
                  </span>
                )}
              </div>

              {isConverting ? (
                <div className="space-y-4">
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${convertProgress}%` }}
                      className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    </motion.div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                        {isHEVC
                          ? "Przeliczanie klatek..."
                          : "Przesuwanie strumienia..."}
                      </span>
                    </div>
                    <span className="text-xs font-black italic text-blue-500">
                      {Math.round(convertProgress)}%
                    </span>
                  </div>
                </div>
              ) : (
                !isConverted && (
                  <button
                    onClick={onStartConversion}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 group active:scale-[0.98]"
                  >
                    <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                    Rozpocznij Przetwarzanie
                  </button>
                )
              )}
            </div>
          )}

          {!currentFile?.toLowerCase().endsWith(".mkv") && (
            <div className="flex flex-col items-center justify-center py-6 opacity-30 text-center">
              <Zap className="w-10 h-10 mb-4 text-green-500/50" />
              <p className="text-[10px] font-black uppercase tracking-widest">
                Format {currentFile?.split(".").pop()?.toUpperCase()}{" "}
                obsługiwany bezpośrednio
              </p>
            </div>
          )}
        </div>
      </div>

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
