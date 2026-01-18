import React from "react";
import {
  ArrowLeft,
  Star,
  Play,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface AnimeHeaderProps {
  anime: any;
  isAddingToLibrary: boolean;
  onAdd: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export const AnimeHeader: React.FC<AnimeHeaderProps> = ({
  anime,
  isAddingToLibrary,
  onAdd,
  onBack,
  isLoading,
}) => {
  if (isLoading || !anime) return <AnimeHeaderSkeleton />;

  const isTracked = !!anime._id;
  // In a real app, this would be fetched from user progress
  const nextEpisode = 1;

  return (
    <div className="relative min-h-[70vh] w-full overflow-hidden">
      {/* Background Blur Image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="absolute inset-0 z-0"
      >
        <img
          src={anime.images.webp.large_image_url}
          className="w-full h-full object-cover scale-110 blur-3xl opacity-20"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex flex-col justify-end pb-16 pt-32">
        <motion.button
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          onClick={onBack}
          className="absolute top-8 left-6 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl transition-all z-20 group"
        >
          <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
        </motion.button>

        <div className="grid md:grid-cols-[320px_1fr] gap-12 items-end">
          {/* Poster */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
            className="hidden md:block aspect-[3/4] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] relative group"
          >
            <img
              src={anime.images.webp.large_image_url}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              alt={anime.title}
            />
          </motion.div>

          {/* Info */}
          <div className="flex flex-col">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-black text-yellow-500">
                  {anime.score || "N/A"}
                </span>
              </div>
              <div className="px-3 py-1 bg-blue-600/10 border border-blue-600/20 rounded-full">
                <span className="text-xs font-black text-blue-500 uppercase tracking-widest">
                  {anime.type}
                </span>
              </div>
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest">
                  {anime.status}
                </span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-[0.85] mb-8 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent"
            >
              {anime.title}
            </motion.h1>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-2 mb-8"
            >
              {anime.genres.map((g: string) => (
                <span
                  key={g}
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5"
                >
                  {g}
                </span>
              ))}
            </motion.div>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm md:text-base text-white/50 leading-relaxed max-w-2xl line-clamp-3 mb-10 font-medium"
            >
              {anime.synopsis}
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex items-center gap-6"
            >
              {anime.localFolderName || isTracked ? (
                <Link
                  href={`/watch/${encodeURIComponent(anime.localFolderName || anime.title)}`}
                  className="flex items-center gap-4 px-10 py-5 bg-white text-black hover:bg-blue-500 hover:text-white rounded-3xl text-sm font-black uppercase tracking-[0.2em] transition-all shadow-[0_20px_40px_-10px_rgba(59,130,246,0.3)] group active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current transition-transform group-hover:scale-110" />
                  {isTracked
                    ? `Oglądaj odcinek ${nextEpisode}`
                    : "Zacznij oglądać"}
                  <ChevronRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </Link>
              ) : (
                <button
                  disabled={isAddingToLibrary}
                  onClick={onAdd}
                  className="flex items-center gap-4 px-10 py-5 bg-blue-600 hover:bg-blue-500 rounded-3xl text-sm font-black uppercase tracking-[0.2em] transition-all shadow-[0_20px_40px_-10px_rgba(59,130,246,0.5)] group disabled:opacity-50 active:scale-95"
                >
                  <AnimatePresence mode="wait">
                    {isAddingToLibrary ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"
                      />
                    ) : (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-4"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Śledź ten tytuł
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              )}

              {isTracked && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="hidden sm:flex items-center gap-2 px-5 py-3 bg-green-500/10 rounded-2xl border border-green-500/20"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-green-500 font-black uppercase tracking-widest">
                    W twojej bibliotece
                  </span>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnimeHeaderSkeleton = () => (
  <div className="relative min-h-[70vh] w-full overflow-hidden bg-[#050505]">
    <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex flex-col justify-end pb-16 pt-32">
      <div className="grid md:grid-cols-[320px_1fr] gap-12 items-end">
        <div className="hidden md:block aspect-[3/4] rounded-[2.5rem] bg-white/5 animate-pulse" />
        <div className="flex flex-col w-full">
          <div className="flex gap-3 mb-6">
            <div className="w-16 h-6 bg-white/5 rounded-full animate-pulse" />
            <div className="w-20 h-6 bg-white/5 rounded-full animate-pulse" />
          </div>
          <div className="w-3/4 h-16 bg-white/5 rounded-3xl mb-8 animate-pulse" />
          <div className="flex gap-2 mb-8">
            <div className="w-20 h-8 bg-white/5 rounded-lg animate-pulse" />
            <div className="w-24 h-8 bg-white/5 rounded-lg animate-pulse" />
            <div className="w-16 h-8 bg-white/5 rounded-lg animate-pulse" />
          </div>
          <div className="w-full h-20 bg-white/5 rounded-2xl mb-10 animate-pulse" />
          <div className="w-64 h-16 bg-white/5 rounded-3xl animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);
