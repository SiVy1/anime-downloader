import React from "react";
import {
  Signal,
  Download,
  ShieldCheck,
  Zap,
  Clock,
  Info,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TorrentModalProps {
  episode: any;
  animeTitle: string;
  results: any[];
  isSearching: boolean;
  downloadingHash: string | null;
  onDownload: (magnet: string, hash: string) => void;
  onClose: () => void;
}

const container = {
  hidden: { opacity: 0 },
  transition: { staggerChildren: 0.05 },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export const TorrentModal: React.FC<TorrentModalProps> = ({
  episode,
  animeTitle,
  results,
  isSearching,
  downloadingHash,
  onDownload,
  onClose,
}) => {
  const getHealthColor = (seeds: number) => {
    if (seeds > 50) return "text-green-500";
    if (seeds > 10) return "text-yellow-500";
    return "text-red-500";
  };

  const getHealthLabel = (seeds: number) => {
    if (seeds > 50) return "Świetna";
    if (seeds > 10) return "Dobra";
    return "Słaba";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10 text-white">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#050505]/80 backdrop-blur-xl"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-8 sm:p-10 border-b border-white/5 flex items-center justify-between bg-gradient-to-b from-white/[0.02] to-transparent">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Zap className="w-6 h-6 text-blue-500 fill-blue-500" />
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">
                Znajdź Źródło
              </h2>
            </div>
            <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em]">
              {animeTitle} — Odcinek {episode.number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group"
          >
            <X className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar">
          {isSearching ? (
            <div className="py-32 flex flex-col items-center justify-center gap-8">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-blue-500/40" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-[0.4em] text-blue-500 animate-pulse">
                  Przeszukiwanie Nyaa.si
                </p>
                <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-2 px-10">
                  Szukamy wersji o najlepszej jakości obrazu i dźwięku...
                </p>
              </div>
            </div>
          ) : results.length > 0 ? (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {results.map((t: any) => {
                const isDownloading = downloadingHash === t.hash;
                const releaseGroup = t.title.split("]")[0].replace("[", "");
                const isTrusted = ["SubsPlease", "Erai-raws"].includes(
                  releaseGroup,
                );
                const isHEVC =
                  t.title.toLowerCase().includes("hevc") ||
                  t.title.toLowerCase().includes("x265");

                return (
                  <motion.div
                    key={t.id}
                    variants={item}
                    className={`group p-6 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-blue-500/30 rounded-3xl transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden ${isDownloading ? "ring-2 ring-blue-500/50 bg-blue-500/5" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        {isTrusted && (
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full ring-1 ring-blue-500/20">
                            <ShieldCheck className="w-3 h-3" /> Zaufana Grupa
                          </span>
                        )}
                        <span
                          className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ring-1 ${isHEVC ? "bg-purple-500/10 text-purple-400 ring-purple-500/20" : "bg-green-500/10 text-green-400 ring-green-500/20"}`}
                        >
                          {isHEVC ? "Wysoka Jakość (HEVC)" : "Standard (x264)"}
                        </span>
                      </div>
                      <h4 className="text-sm font-black truncate text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight mb-3">
                        {t.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Signal
                            className={`w-4 h-4 ${getHealthColor(t.seeders)}`}
                          />
                          <div className="flex flex-col leading-none">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                              Dostępność
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase tracking-widest ${getHealthColor(t.seeders)}`}
                            >
                              {getHealthLabel(t.seeders)} ({t.seeders})
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Download className="w-4 h-4 text-white/40" />
                          <div className="flex flex-col leading-none">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                              Rozmiar
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                              {t.size}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock
                            className={`w-4 h-4 ${isHEVC ? "text-yellow-500/60" : "text-green-500/60"}`}
                          />
                          <div className="flex flex-col leading-none">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                              Czas startu
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase tracking-widest ${isHEVC ? "text-yellow-500/60" : "text-green-500/60"}`}
                            >
                              {isHEVC ? "Wymaga konwersji" : "Błyskawiczny"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      disabled={isDownloading}
                      onClick={() => onDownload(t.magnet, t.hash)}
                      className={`w-full sm:w-auto px-10 h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden ${
                        isDownloading
                          ? "bg-blue-600/20 text-blue-500/50 cursor-not-allowed border border-blue-500/20"
                          : "bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20 active:scale-95"
                      }`}
                    >
                      <span className="relative z-10">
                        {isDownloading ? "Startowanie..." : "Dodaj do Listy"}
                      </span>
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mb-8">
                <Info className="w-10 h-10 text-white/10" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-widest text-white/50 italic">
                Cisza w eterze
              </h3>
              <p className="text-xs text-white/20 font-bold uppercase tracking-widest mt-3 max-w-xs leading-loose">
                Nie znaleziono odpowiednich wersji dla tego odcinka. Spróbuj
                zmienić parametry wyszukiwania.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
