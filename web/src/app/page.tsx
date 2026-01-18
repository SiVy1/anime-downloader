"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Folder,
  Search,
  HardDrive,
  Star,
  CloudOff,
  Calendar,
  Library,
  Compass,
  Plus,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import SeasonView from "@/components/SeasonView";
import { UserMenu } from "@/components/ui/UserMenu";

type Tab = "library" | "season";

// Card for database anime (has full metadata)
function DbAnimeCard({ anime }: { anime: any }) {
  const hasFolder = !!anime.localFolderName;
  const href = hasFolder
    ? `/watch/${encodeURIComponent(anime.localFolderName)}`
    : `/anime/${anime.anilistId}`;

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

        {/* Status indicator */}
        {!hasFolder && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-lg flex items-center gap-1">
            <CloudOff className="w-3 h-3 text-orange-400" />
            <span className="text-[8px] font-black text-orange-400 uppercase">
              Tylko online
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

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<Tab>("library");
  const [libraryAnime, setLibraryAnime] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineResults, setOnlineResults] = useState<any[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [isAddingToLibrary, setIsAddingToLibrary] = useState<number | null>(
    null,
  );

  // Tracked anime AniList IDs for SeasonView
  const trackedIds = new Set(libraryAnime.map((a) => a.anilistId));

  const fetchLibrary = () => {
    fetch("/api/library")
      .then((res) => res.json())
      .then((data) => {
        if (data.anime) setLibraryAnime(data.anime);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  // Online search with debouncing
  useEffect(() => {
    if (searchQuery.length < 3) {
      setOnlineResults([]);
      return;
    }

    // Unified search remains on current tab

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

  const addToLibrary = async (anime: any) => {
    const anilistId = anime.id || anime.anilistId;
    setIsAddingToLibrary(anilistId);
    try {
      const res = await fetch(`/api/anime/${anilistId}/add`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        fetchLibrary(); // Refresh library
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingToLibrary(null);
    }
  };

  const filteredAnime = libraryAnime.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const tabs = [
    { id: "library" as Tab, label: "Biblioteka", icon: Library },
    { id: "season" as Tab, label: "Odkrywaj", icon: Compass },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Play className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none">
                AniStream
              </h1>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.2em] mt-1">
                Alpha v0.4
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-lg relative">
            <Search
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                isSearchingOnline
                  ? "text-blue-500 animate-pulse"
                  : "text-white/20"
              }`}
            />
            <input
              type="text"
              placeholder="Wyszukaj anime..."
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-2.5 pl-11 pr-4 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
              <HardDrive className="w-3 h-3 text-blue-500" />
              <span>{libraryAnime.length} Śledzonych</span>
            </div>
            <UserMenu />
          </div>
        </div>

        {/* Tabs - Consolidated 2-way Toggle */}
        <div className="max-w-7xl mx-auto px-6 pb-2">
          <div className="flex gap-1 p-1 bg-white/5 backdrop-blur-md rounded-xl w-fit border border-white/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-[0_4px_20px_rgba(37,99,235,0.3)]"
                    : "text-white/30 hover:text-white/60 hover:bg-white/5"
                }`}
              >
                <tab.icon
                  className={`w-3.5 h-3.5 transition-transform duration-500 ${activeTab === tab.id ? "scale-110" : ""}`}
                />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12 flex-1">
        {/* Search Results Overlay / Section */}
        <AnimatePresence mode="wait">
          {searchQuery.length >= 3 ? (
            <motion.section
              key="search-results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-12"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black italic uppercase tracking-widest flex items-center gap-3 text-blue-500">
                  <div className="w-4 h-[2px] bg-blue-600" />
                  Wyniki Wyszukiwania
                </h2>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white/60 transition-colors"
                >
                  Usuń filtry
                </button>
              </div>

              {isSearchingOnline ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                    Globalne przeszukiwanie...
                  </p>
                </div>
              ) : onlineResults.length > 0 || filteredAnime.length > 0 ? (
                <div className="space-y-16">
                  {filteredAnime.length > 0 && (
                    <div className="space-y-8">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                        W twojej bibliotece
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 lg:gap-8">
                        {filteredAnime.map((anime) => (
                          <DbAnimeCard key={anime._id} anime={anime} />
                        ))}
                      </div>
                    </div>
                  )}

                  {onlineResults.length > 0 && (
                    <div className="space-y-8">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                        W sieci (AniList)
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 lg:gap-8">
                        {onlineResults.map((anime) => {
                          const isTracked = trackedIds.has(anime.id);
                          const isAdding = isAddingToLibrary === anime.id;
                          return (
                            <div
                              key={anime.id}
                              className="group relative flex flex-col"
                            >
                              <div className="aspect-[3/4] relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 group-hover:border-blue-500/50 transition-all duration-300 shadow-lg">
                                <img
                                  src={
                                    anime.images?.jpg?.large_image_url ||
                                    anime.images?.jpg?.image_url
                                  }
                                  alt={anime.title}
                                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                {anime.score && (
                                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg flex items-center gap-1.5">
                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    <span className="text-[10px] font-black text-white">
                                      {anime.score}
                                    </span>
                                  </div>
                                )}
                                {isTracked && (
                                  <div className="absolute top-2 right-2 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-lg">
                                    <span className="text-[8px] font-black text-green-400 uppercase">
                                      Śledzisz
                                    </span>
                                  </div>
                                )}
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 backdrop-blur-sm">
                                  <Link
                                    href={`/anime/${anime.id}`}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                  >
                                    Szczegóły
                                  </Link>
                                  {!isTracked && (
                                    <button
                                      disabled={isAdding}
                                      onClick={() => addToLibrary(anime)}
                                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg disabled:opacity-50"
                                    >
                                      {isAdding ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Plus className="w-3 h-3" />
                                      )}
                                      Śledź
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="mt-3 px-1">
                                <p className="text-xs font-bold leading-tight line-clamp-2 uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                                  {anime.title}
                                </p>
                                <p className="text-[9px] text-white/30 mt-1 uppercase font-black">
                                  {anime.type} • {anime.episodes || "?"} odc.
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-32 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10">
                  <p className="text-white/40 font-black uppercase tracking-widest text-sm">
                    Brak wyników dla &quot;{searchQuery}&quot;
                  </p>
                </div>
              )}
            </motion.section>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: activeTab === "library" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeTab === "library" ? -20 : 20 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-full h-full"
            >
              {activeTab === "library" ? (
                <section>
                  <div className="flex items-center justify-between mb-12">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-4">
                      <div className="w-10 h-1.5 bg-blue-600 rounded-full" />
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
                  ) : filteredAnime.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 lg:gap-8">
                      {filteredAnime.map((anime) => (
                        <DbAnimeCard key={anime._id} anime={anime} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-32 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10 flex flex-col items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                        <Library className="w-10 h-10 text-white/10" />
                      </div>
                      <p className="text-white/40 font-black uppercase tracking-widest text-sm">
                        Twoja biblioteka jest pusta
                      </p>
                      <button
                        onClick={() => setActiveTab("season")}
                        className="mt-6 flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                      >
                        Odkrywaj Nowości
                      </button>
                    </div>
                  )}
                </section>
              ) : (
                <section>
                  <div className="flex items-center justify-between mb-12">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-4">
                      <div className="w-10 h-1.5 bg-blue-600 rounded-full" />
                      Aktualnie Emitowane
                    </h2>
                  </div>
                  <SeasonView
                    trackedIds={Array.from(trackedIds)}
                    onTrack={addToLibrary}
                  />
                </section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
