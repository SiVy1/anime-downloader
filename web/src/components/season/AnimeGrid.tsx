import React from "react";
import { Star, Plus, Check, Calendar, Tv } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SeasonAnime } from "@/hooks/useSeasonAnime";

interface AnimeGridProps {
  anime: SeasonAnime[];
  trackedIds: Set<number>;
  onTrack: (anime: SeasonAnime) => void;
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

export const AnimeGrid: React.FC<AnimeGridProps> = ({
  anime,
  trackedIds,
  onTrack,
}) => {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
    >
      <AnimatePresence mode="popLayout">
        {anime.map((a) => {
          const isTracked = trackedIds.has(a.mal_id);
          const imageUrl =
            a.images?.webp?.large_image_url || a.images?.jpg?.large_image_url;

          return (
            <motion.div
              layout
              key={a.mal_id}
              variants={item}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative flex flex-col"
            >
              {/* Card */}
              <div className="aspect-[3/4] relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 group-hover:border-blue-500/50 transition-all duration-300 shadow-lg">
                {imageUrl ? (
                  <motion.img
                    src={imageUrl}
                    alt={a.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                    <Tv className="w-12 h-12 text-white/10" />
                  </div>
                )}

                {/* Score Badge */}
                {a.score && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg z-10">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-[10px] font-black text-white">
                      {a.score.toFixed(1)}
                    </span>
                  </div>
                )}

                {/* Tracked Badge */}
                <AnimatePresence>
                  {isTracked && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center z-10 shadow-lg"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hover Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 backdrop-blur-[2px] z-20">
                  <Link
                    href={`/anime/${a.mal_id}`}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                  >
                    Szczegóły
                  </Link>
                  {!isTracked && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        onTrack(a);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                      Śledź
                    </button>
                  )}
                </div>

                {/* Info Bar */}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent z-10">
                  {a.broadcast && (
                    <div className="flex items-center gap-1 mb-1">
                      <Calendar className="w-2.5 h-2.5 text-blue-400" />
                      <span className="text-[8px] text-blue-400 font-bold uppercase tracking-wider">
                        {a.broadcast}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/70 font-medium">
                      {a.episodes ? `${a.episodes} odc.` : "W emisji"}
                    </span>
                    {a.studios[0] && (
                      <span className="text-[9px] text-white/40 italic">
                        {a.studios[0]}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Title & Genres */}
              <div className="mt-3 px-1">
                <Link
                  href={`/anime/${a.mal_id}`}
                  className="block group-hover:text-blue-400 transition-colors"
                >
                  <p className="text-sm font-bold leading-snug line-clamp-2 text-white/90">
                    {a.title_english || a.title}
                  </p>
                </Link>
                {a.genres.length > 0 && (
                  <p className="text-[10px] text-white/30 mt-1 font-medium line-clamp-1">
                    {a.genres.slice(0, 3).join(" • ")}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};
