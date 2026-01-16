"use client";

import { useState, useEffect } from "react";
import {
  Play,
  Folder,
  Search,
  Download,
  Clock,
  HardDrive,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";

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
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-blue-500/30">
      {/* Search Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Play className="w-5 h-5 fill-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">AniStream</h1>
          </div>

          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Szukaj w bibliotece..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:border-blue-500/50 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-6 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              <span>{folders.length} Seri</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold flex items-center gap-3">
            <LayoutGrid className="w-6 h-6 text-blue-500" />
            Twoja Biblioteka
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] bg-white/5 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredFolders.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredFolders.map((folder) => (
              <Link
                key={folder}
                href={`/watch/${encodeURIComponent(folder)}`}
                className="group relative"
              >
                <div className="aspect-[3/4] relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 group-hover:border-blue-500/50 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60" />

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-xl">
                      <Play className="w-6 h-6 fill-white ml-1" />
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-blue-400 Transition-colors">
                      {folder}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <Folder className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">
              Biblioteka jest pusta lub brak wyników.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
