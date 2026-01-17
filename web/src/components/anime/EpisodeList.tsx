import React from "react";
import { LayoutGrid, List, Download, CheckCircle2, Clock } from "lucide-react";

interface EpisodeListProps {
  episodes: any[];
  episodesCount?: number;
  onSearchTorrent: (episode: any) => void;
}

export const EpisodeList: React.FC<EpisodeListProps> = ({
  episodes,
  episodesCount,
  onSearchTorrent,
}) => {
  return (
    <main className="max-w-7xl mx-auto px-6 py-20">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-4">
            <div className="w-10 h-1.5 bg-blue-600 rounded-full" />
            Lista Odcinków
          </h2>
          <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] mt-3">
            Łącznie {episodesCount || episodes.length} odcinków
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            <button className="p-2 bg-blue-600 rounded-lg shadow-lg">
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-white/5 rounded-lg transition-all">
              <List className="w-4 h-4 text-white/40" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {episodes.map((ep: any) => (
          <div
            key={ep._id}
            className="group relative bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden hover:border-blue-500/30 transition-all duration-500 shadow-xl"
          >
            {/* Overlay for not downloaded */}
            {!ep.isDownloaded && (
              <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                <button
                  onClick={() => onSearchTorrent(ep)}
                  className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                  <Download className="w-5 h-5" />
                </button>
                <span className="text-[8px] font-black uppercase tracking-widest">
                  Szukaj Torrenta
                </span>
              </div>
            )}

            <div className="aspect-video relative bg-white/5">
              {/* Episode Number Badge */}
              <div className="absolute top-3 left-3 z-20 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-[10px] font-black">
                EP {ep.number}
              </div>

              {/* Download Status */}
              <div
                className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border ${ep.isDownloaded ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-white/5 border-white/10 text-white/20"}`}
              >
                {ep.isDownloaded ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
            </div>

            <div className="p-5">
              <h3 className="text-sm font-bold uppercase tracking-tight line-clamp-1 mb-2 group-hover:text-blue-400 transition-colors">
                {ep.title || `Odcinek ${ep.number}`}
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-white/30">
                  <Clock className="w-3 h-3" />
                  {ep.airedDate || "N/A"}
                </div>
                {ep.isDownloaded && (
                  <div className="w-1 h-1 rounded-full bg-white/10" />
                )}
                {ep.isDownloaded && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-green-500/60">
                    Gotowy
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};
