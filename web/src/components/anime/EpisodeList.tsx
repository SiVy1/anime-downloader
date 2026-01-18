import React from "react";
import {
  LayoutGrid,
  List,
  Download,
  CheckCircle2,
  Clock,
  Play,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EpisodeListProps {
  episodes: any[];
  episodesCount?: number;
  onSearchTorrent: (episode: any) => void;
  isLoading?: boolean;
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
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export const EpisodeList: React.FC<EpisodeListProps> = ({
  episodes,
  episodesCount,
  onSearchTorrent,
  isLoading,
}) => {
  if (isLoading) return <EpisodeListSkeleton />;

  return (
    <main className="max-w-7xl mx-auto px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12"
      >
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-4">
            <div className="w-10 h-1.5 bg-blue-600 rounded-full" />
            Lista Odcinków
          </h2>
          <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] mt-3">
            Łącznie {episodesCount || episodes.length} odcinków
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            <button className="p-2 bg-blue-600 rounded-lg shadow-lg">
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-white/5 rounded-lg transition-all">
              <List className="w-4 h-4 text-white/40" />
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {episodes.map((ep: any) => (
          <motion.div
            key={ep._id}
            variants={item}
            className={`group relative bg-[#0a0a0a] border rounded-3xl overflow-hidden transition-all duration-500 shadow-xl ${
              ep.isDownloaded
                ? "border-white/10 hover:border-blue-500/50"
                : "border-white/5 opacity-60 hover:opacity-100"
            }`}
          >
            {/* Overlay for not downloaded */}
            {!ep.isDownloaded && (
              <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                <button
                  onClick={() => onSearchTorrent(ep)}
                  className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:scale-110 active:scale-95 transition-all group/btn"
                >
                  <Download className="w-6 h-6 group-hover/btn:translate-y-0.5 transition-transform" />
                </button>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/80">
                  Szukaj Torrenta
                </span>
              </div>
            )}

            <div className="aspect-video relative bg-white/5 group-hover:scale-105 transition-transform duration-700">
              {/* Episode Number Badge */}
              <div className="absolute top-3 left-3 z-20 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-[10px] font-black">
                EP {ep.number}
              </div>

              {/* Status Icon */}
              <div
                className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border ${
                  ep.isDownloaded
                    ? "bg-green-500/20 border-green-500/30 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                    : "bg-white/5 border-white/10 text-white/20"
                }`}
              >
                {ep.isDownloaded ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>

              {ep.isDownloaded && (
                <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                  <Play className="w-12 h-12 fill-white" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
            </div>

            <div className="p-5">
              <h3 className="text-sm font-bold uppercase tracking-[0.05em] line-clamp-1 mb-2 group-hover:text-blue-400 transition-colors">
                {ep.title || `Odcinek ${ep.number}`}
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/30">
                  <CalendarIcon className="w-3 h-3" />
                  {ep.airedDate || "N/A"}
                </div>
                {ep.isDownloaded && (
                  <>
                    <div className="w-1 h-1 rounded-full bg-white/10" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-500/80 bg-blue-500/10 px-2 py-0.5 rounded-md">
                      Pobrany
                    </span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </main>
  );
};

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const EpisodeListSkeleton = () => (
  <div className="max-w-7xl mx-auto px-6 py-20">
    <div className="flex items-center justify-between mb-12">
      <div className="w-64 h-10 bg-white/5 rounded-full animate-pulse" />
      <div className="w-32 h-10 bg-white/5 rounded-full animate-pulse" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="aspect-video bg-white/5 rounded-3xl animate-pulse"
        />
      ))}
    </div>
  </div>
);
