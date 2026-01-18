import React from "react";
import { Star, Play, CheckCircle2, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { SeasonAnime } from "@/hooks/useSeasonAnime";

interface AnimeGridProps {
  anime: SeasonAnime[];
  trackedIds: number[];
  onTrack?: (anime: SeasonAnime) => void;
}

export const AnimeGrid: React.FC<AnimeGridProps> = ({
  anime,
  trackedIds = [],
  onTrack,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8">
      <AnimatePresence mode="popLayout">
        {anime.map((item, index) => {
          const isTracked =
            Array.isArray(trackedIds) && trackedIds.includes(item.id);

          return (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{
                duration: 0.4,
                delay: Math.min(index * 0.05, 0.4),
                layout: { duration: 0.4, type: "spring", bounce: 0.2 },
              }}
              className="group relative flex flex-col"
            >
              <Link
                href={`/anime/${item.id}`}
                className="block relative aspect-[2/3] rounded-[2rem] overflow-hidden glass-panel group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all"
              >
                {/* Image Component */}
                <img
                  src={
                    item.images?.jpg?.large_image_url ||
                    item.images?.jpg?.image_url
                  }
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />

                {/* Glass Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Hover Actions */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                  <div className="glass-button w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl">
                    <Play className="w-8 h-8 fill-current ml-1" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90 text-glow-blue">
                    Zobacz Detale
                  </span>
                </div>

                {/* Score Badge */}
                <div className="absolute top-4 left-4 glass-panel px-3 py-1.5 rounded-xl flex items-center gap-1.5 border-white/10 shadow-lg">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-[10px] font-black italic text-white/90">
                    {item.score || "N/A"}
                  </span>
                </div>

                {/* Tracked Badge */}
                {isTracked && (
                  <div className="absolute top-4 right-4 w-10 h-10 glass-panel rounded-xl flex items-center justify-center border-blue-500/30 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    <Heart className="w-5 h-5 fill-current" />
                  </div>
                )}
              </Link>

              {/* Info Area */}
              <div className="mt-5 px-1">
                <div className="flex justify-between items-start gap-3 mb-1.5">
                  <h3 className="text-sm font-black italic uppercase tracking-tight text-white/90 group-hover:text-blue-400 transition-colors line-clamp-1 flex-1">
                    {item.title_english || item.title}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                    {item.type || "TV"}
                  </span>
                  <span className="w-1 h-1 bg-white/10 rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                    {item.airing ? "W emisji" : "Zakończono"}
                  </span>
                  {item.studios?.[0] && (
                    <>
                      <span className="w-1 h-1 bg-white/10 rounded-full" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/20 truncate max-w-[80px]">
                        {item.studios[0]}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Track Action in Footer - visible on hover */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onTrack?.(item);
                }}
                className={`mt-4 h-12 rounded-2xl glass-button flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all ${isTracked ? "text-blue-400 bg-blue-500/10 border-blue-500/20" : "text-white/40"}`}
              >
                {isTracked ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                      Oglądasz
                    </span>
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                      Śledź serię
                    </span>
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
