"use client";

import { useState, useEffect } from "react";
import { Play, Folder, Search, HardDrive, Star } from "lucide-react";
import Link from "next/link";
import { searchAnime, JikanAnime } from "@/lib/jikanService";

function AnimeCard({ folder }: { folder: string }) {
  const [anime, setAnime] = useState<JikanAnime | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    searchAnime(folder)
      .then(setAnime)
      .finally(() => setLoading(false));
  }, [folder]);

  return (
    <Link
      href={`/watch/${encodeURIComponent(folder)}`}
      className="group relative flex flex-col h-full"
    >
      <div className="aspect-[3/4] relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 group-hover:border-blue-500/50 transition-all duration-300 shadow-lg group-hover:shadow-blue-500/10">
        {loading ? (
          <div className="absolute inset-0 animate-pulse bg-white/5 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : anime ? (
          <>
            <img
              src={
                anime.images.jpg.large_image_url || anime.images.jpg.image_url
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
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic text-center px-4">
              Metadata Unavailable
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
          {anime?.title || folder}
        </p>
        {anime && anime.title.toLowerCase() !== folder.toLowerCase() && (
          <p className="text-[9px] text-white/30 truncate mt-1 italic uppercase font-medium">
            {folder}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function LibraryPage() {
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/library")
      .then((res) => res.json())
      .then((data) => {
        if (data.folders) setFolders(data.folders);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredFolders = folders.filter((f) =>
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
                Alpha v0.2
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-lg relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              type="text"
              placeholder="Wyszukaj w swojej kolekcji..."
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-2.5 pl-11 pr-4 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="hidden md:flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-white/40">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
              <HardDrive className="w-3 h-3 text-blue-500" />
              <span>{folders.length} Series</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
            <div className="w-8 h-1 bg-blue-600 rounded-full" />
            Biblioteka
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
        ) : filteredFolders.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 lg:gap-8">
            {filteredFolders.map((folder) => (
              <AnimeCard key={folder} folder={folder} />
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
