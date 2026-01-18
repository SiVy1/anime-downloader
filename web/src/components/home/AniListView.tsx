"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Play, Calendar, Eye, LogIn } from "lucide-react";
import Link from "next/link";

interface AniListEntry {
  id: number;
  mediaId: number;
  status: string;
  progress: number;
  media: {
    id: number;
    title: {
      romaji: string;
      english: string | null;
    };
    coverImage: {
      large: string;
      extraLarge: string;
    };
    episodes: number | null;
    status: string;
    nextAiringEpisode?: {
      episode: number;
      airingAt: number;
    };
  };
}

type ListType = "current" | "planning";

export function AniListView() {
  const { data: session, status } = useSession();
  const [activeList, setActiveList] = useState<ListType>("current");
  const [entries, setEntries] = useState<AniListEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) return;

    const fetchList = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/anilist/planning?type=${activeList}`);
        const data = await res.json();
        setEntries(data.entries || []);
      } catch (err) {
        console.error("Failed to fetch AniList:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [session?.accessToken, activeList]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-32 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10 flex flex-col items-center justify-center gap-6">
        <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center">
          <LogIn className="w-10 h-10 text-blue-500" />
        </div>
        <div>
          <p className="text-white/60 font-bold text-lg mb-2">
            Zaloguj się przez AniList
          </p>
          <p className="text-white/30 text-sm max-w-md">
            Aby zobaczyć swoją listę anime, zaloguj się używając przycisku w
            prawym górnym rogu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Sub-tabs for Current / Planning */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit border border-white/5">
        <button
          onClick={() => setActiveList("current")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
            activeList === "current"
              ? "bg-blue-600 text-white"
              : "text-white/30 hover:text-white/60"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Oglądam
        </button>
        <button
          onClick={() => setActiveList("planning")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
            activeList === "planning"
              ? "bg-blue-600 text-white"
              : "text-white/30 hover:text-white/60"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Planuję
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : entries.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 lg:gap-8">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              href={`/anime/${entry.media.id}`}
              className="group relative flex flex-col"
            >
              <div className="aspect-[3/4] relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 group-hover:border-blue-500/50 transition-all duration-300 shadow-lg">
                <img
                  src={
                    entry.media.coverImage.extraLarge ||
                    entry.media.coverImage.large
                  }
                  alt={entry.media.title.romaji}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Progress badge */}
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg">
                  <span className="text-[10px] font-black text-white">
                    {entry.progress}/{entry.media.episodes || "?"}
                  </span>
                </div>

                {/* Next episode badge */}
                {entry.media.nextAiringEpisode && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <span className="text-[8px] font-black text-green-400 uppercase">
                      Ep {entry.media.nextAiringEpisode.episode} wkrótce
                    </span>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-xl">
                    <Play className="w-6 h-6 fill-white ml-1" />
                  </div>
                </div>
              </div>

              <div className="mt-3 px-1">
                <p className="text-xs font-bold leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                  {entry.media.title.english || entry.media.title.romaji}
                </p>
                {entry.media.title.english && (
                  <p className="text-[9px] text-white/30 truncate mt-1 italic">
                    {entry.media.title.romaji}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10">
          <p className="text-white/40 font-black uppercase tracking-widest text-sm">
            {activeList === "current"
              ? "Nie oglądasz obecnie żadnego anime"
              : "Twoja lista planowanych jest pusta"}
          </p>
        </div>
      )}
    </div>
  );
}
