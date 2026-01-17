import React from "react";
import { ArrowLeft, Star, Play, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AnimeHeaderProps {
  anime: any;
  isAddingToLibrary: boolean;
  onAdd: () => void;
  onBack: () => void;
}

export const AnimeHeader: React.FC<AnimeHeaderProps> = ({
  anime,
  isAddingToLibrary,
  onAdd,
  onBack,
}) => {
  const router = useRouter();

  return (
    <div className="relative h-[60vh] w-full overflow-hidden">
      {/* Background Blur Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={anime.images.webp.large_image_url}
          className="w-full h-full object-cover scale-110 blur-3xl opacity-20"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex flex-col justify-end pb-12">
        <button
          onClick={onBack}
          className="absolute top-8 left-6 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl transition-all"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="grid md:grid-cols-[280px_1fr] gap-10 items-end">
          {/* Poster */}
          <div className="hidden md:block aspect-[3/4] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
            <img
              src={anime.images.webp.large_image_url}
              className="w-full h-full object-cover"
              alt={anime.title}
            />
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-4">
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
            </div>

            <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-[0.9] mb-6 drop-shadow-2xl">
              {anime.title}
            </h1>

            <div className="flex flex-wrap gap-2 mb-8">
              {anime.genres.map((g: string) => (
                <span
                  key={g}
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-3 py-1.5 bg-white/5 rounded-lg"
                >
                  {g}
                </span>
              ))}
            </div>

            <p className="text-sm md:text-base text-white/60 leading-relaxed max-w-2xl line-clamp-3 mb-8">
              {anime.synopsis}
            </p>

            <div className="flex items-center gap-4">
              {anime.localFolderName ? (
                <Link
                  href={`/watch/${encodeURIComponent(anime.localFolderName)}`}
                  className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-600/20 group"
                >
                  <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
                  Oglądaj
                </Link>
              ) : anime._id ? (
                <Link
                  href={`/watch/${encodeURIComponent(anime.title)}`}
                  className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-600/20 group"
                >
                  <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
                  Oglądaj
                </Link>
              ) : (
                <button
                  disabled={isAddingToLibrary}
                  onClick={onAdd}
                  className="flex items-center gap-3 px-8 py-4 bg-green-600 hover:bg-green-500 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-green-600/20 group disabled:opacity-50"
                >
                  {isAddingToLibrary ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  )}
                  {isAddingToLibrary ? "Dodawanie..." : "Śledź"}
                </button>
              )}

              {anime._id && (
                <span className="text-[10px] text-green-500 font-black uppercase tracking-widest flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-xl border border-green-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  Śledzisz
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
