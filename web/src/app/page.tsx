"use client";

import { useState, useEffect } from "react";
import { Play, Folder, Search, HardDrive, Star, CloudOff } from "lucide-react";
import Link from "next/link";
import type { JikanAnime } from "@/lib/jikanService";

// Card for database anime (has full metadata)
function DbAnimeCard({ anime }: { anime: any }) {
  const hasFolder = !!anime.localFolderName;
  const href = hasFolder
    ? `/watch/${encodeURIComponent(anime.localFolderName)}`
    : `/anime/${anime.malId}`;

  return (
    <Link href={href} className="group relative flex flex-col h-full">
      <div className="aspect-[3/4] relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 group-hover:border-blue-500/50 transition-all duration-300 shadow-lg group-hover:shadow-blue-500/10">
        {anime.images?.jpg?.large_image_url ||
        anime.images?.webp?.large_image_url ? (
          <>
            <img
              src={
                anime.images?.webp?.large_image_url ||
                anime.images?.jpg?.large_image_url
              }
              alt={anime.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/60 to-transparent">
              <div className="flex items-center gap-1.5">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-[10px] font-black text-white/90">
                  {anime.score || "N/A"}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-white/10 to-transparent">
            <Folder className="w-12 h-12 text-white/10" />
          </div>
        )}

        {/* Unlinked indicator */}
        {!hasFolder && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-lg flex items-center gap-1">
            <CloudOff className="w-3 h-3 text-orange-400" />
            <span className="text-[8px] font-black text-orange-400 uppercase">
              Online
            </span>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 fill-white ml-1" />
          </div>
        </div>
      </div>

      <div className="mt-3 px-1">
        <p className="text-xs font-bold leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors uppercase tracking-tight">
          {anime.title}
        </p>
        {anime.localFolderName && anime.title !== anime.localFolderName && (
          <p className="text-[9px] text-white/30 truncate mt-1 italic uppercase font-medium">
            {anime.localFolderName}
          </p>
        )}
      </div>
    </Link>
  );
}

// Card for unlinked folders (no database entry)
function FolderCard({ folder }: { folder: string }) {
  return (
    <Link
      href={`/watch/${encodeURIComponent(folder)}`}
      className="group relative flex flex-col h-full"
    >
      <div className="aspect-[3/4] relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 group-hover:border-blue-500/50 transition-all duration-300 shadow-lg">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-white/10 to-transparent">
          <Folder className="w-12 h-12 text-white/20" />
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest text-center px-4">
            Unlinked Folder
          </span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-xl">
            <Play className="w-6 h-6 fill-white ml-1" />
          </div>
        </div>
      </div>
      <div className="mt-3 px-1">
        <p className="text-xs font-bold leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors uppercase tracking-tight">
          {folder}
        </p>
      </div>
    </Link>
  );
}

export default function LibraryPage() {
  const [libraryAnime, setLibraryAnime] = useState<any[]>([]);
  const [unlinkedFolders, setUnlinkedFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineResults, setOnlineResults] = useState<any[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  useEffect(() => {
    fetch("/api/library")
      .then((res) => res.json())
      .then((data) => {
        if (data.anime) setLibraryAnime(data.anime);
        if (data.unlinkedFolders) setUnlinkedFolders(data.unlinkedFolders);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Wyszukiwanie online z debouncingiem (uproszczonym)
  useEffect(() => {
    if (searchQuery.length < 3) {
      setOnlineResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const res = await fetch(
          `/api/anime/search?q=${encodeURIComponent(searchQuery)}`,
        );
        const data = await res.json();
        setOnlineResults(data.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter library anime by search query
  const filteredAnime = libraryAnime.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredUnlinked = unlinkedFolders.filter((f) =>
    f.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">
      {/* Search Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/60 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Play className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none">
                AniStream
              </h1>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.2em] mt-1">
                Alpha v0.3
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-lg relative">
            <Search
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSearchingOnline ? "text-blue-500 animate-pulse" : "text-white/20"}`}
            />
            <input
              type="text"
              placeholder="Wyszukaj anime w kolekcji lub online..."
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-2.5 pl-11 pr-4 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="hidden md:flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-white/40">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
              <HardDrive className="w-3 h-3 text-blue-500" />
              <span>{libraryAnime.length} Series</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Sekcja wyników online jeśli szukamy */}
        {searchQuery.length >= 3 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm font-black italic uppercase tracking-widest flex items-center gap-3 text-white/40">
                <div className="w-4 h-[2px] bg-blue-600" />
                Wyniki Online
              </h2>
            </div>

            {isSearchingOnline ? (
              <div className="flex items-center gap-4 text-xs text-white/20 font-bold uppercase tracking-widest animate-pulse">
                <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                Przeszukiwanie bazy globalnej...
              </div>
            ) : onlineResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {onlineResults.map((anime) => (
                  <div
                    key={anime.mal_id}
                    className="group relative flex flex-col h-full bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden hover:border-blue-500/30 transition-all"
                  >
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <img
                        src={
                          anime.images.webp.large_image_url ||
                          anime.images.webp.image_url
                        }
                        alt={anime.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {anime.inLibrary && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-green-600/90 backdrop-blur-md rounded-lg text-[8px] font-black uppercase tracking-widest text-white shadow-lg">
                          W kolekcji
                        </div>
                      )}

                      {/* Akcje dla wyniku online */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <Link
                          href={`/anime/${anime.mal_id}`}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                        >
                          Szczegóły
                        </Link>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] font-bold line-clamp-2 leading-tight uppercase tracking-tight text-white/80 group-hover:text-white transition-colors">
                        {anime.title}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">
                          {anime.type} • {anime.episodes || "?"} EP
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                          <span className="text-[9px] font-black">
                            {anime.score || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-white/20 font-bold uppercase tracking-widest italic">
                Brak wyników w bazie globalnej dla "{searchQuery}"
              </div>
            )}

            <div className="mt-12 h-[1px] bg-white/5" />
          </section>
        )}

        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
            <div className="w-8 h-1 bg-blue-600 rounded-full" />
            Moja Biblioteka
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="aspect-[3/4] bg-white/5 rounded-2xl animate-pulse border border-white/5" />
                <div className="h-4 bg-white/5 rounded-md animate-pulse w-3/4" />
              </div>
            ))}
          </div>
        ) : filteredAnime.length > 0 || filteredUnlinked.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 lg:gap-8">
            {filteredAnime.map((anime) => (
              <DbAnimeCard key={anime._id} anime={anime} />
            ))}
            {filteredUnlinked.map((folder) => (
              <FolderCard key={folder} folder={folder} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Folder className="w-10 h-10 text-white/10" />
            </div>
            <p className="text-white/40 font-bold uppercase tracking-widest text-sm">
              Biblioteka jest pusta
            </p>
            <p className="text-[10px] text-white/20 uppercase mt-2">
              Brak dopasowań dla "{searchQuery}"
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
