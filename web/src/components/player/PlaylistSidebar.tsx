import React from "react";
import {
  Play,
  Download,
  CheckCircle2,
  ChevronRight,
  Loader2,
  MonitorPlay,
} from "lucide-react";

interface PlaylistSidebarProps {
  episodes: any[];
  currentFile: string | null;
  onSelect: (file: string) => void;
  onDownload: (episode: any) => void;
  downloadingFiles: string[];
  loading?: boolean;
  isMobile?: boolean;
}

export const PlaylistSidebar: React.FC<PlaylistSidebarProps> = ({
  episodes,
  currentFile,
  onSelect,
  onDownload,
  downloadingFiles,
  loading,
  isMobile,
}) => {
  return (
    <div
      className={`${isMobile ? "bg-transparent border-none shadow-none" : "bg-[#080808] border-l border-white/5 h-full shadow-[-32px_0_64px_-32px_rgba(0,0,0,0.5)]"} flex flex-col z-40`}
    >
      {!isMobile && (
        <div className="p-6 border-b border-white/5 bg-[#0a0a0a]/50">
          <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Playlist
            <span className="ml-auto bg-white/10 px-2 py-0.5 rounded text-[10px] text-white/60">
              {episodes.length}
            </span>
          </h3>
        </div>
      )}

      <div
        className={`${isMobile ? "p-0" : "flex-1 overflow-y-auto p-4 custom-scrollbar"} flex flex-col gap-2`}
      >
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-white/5 rounded-2xl animate-pulse"
            />
          ))
        ) : episodes.length > 0 ? (
          episodes.map((ep) => {
            const isDownloading = downloadingFiles.some((df) =>
              df.endsWith(ep.localPath),
            );
            const isActive = currentFile === ep.localPath;

            return (
              <div
                key={ep._id}
                role="listitem"
                onClick={() => {
                  if (ep.isDownloaded) onSelect(ep.localPath);
                }}
                className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all text-left relative overflow-hidden ${
                  isActive
                    ? "bg-blue-600 border-blue-400 shadow-[0_8px_32px_rgba(37,99,235,0.3)] cursor-pointer"
                    : ep.isDownloaded
                      ? "bg-[#0c0c0c] border-white/5 hover:border-white/10 hover:bg-[#121212] cursor-pointer"
                      : "bg-[#050505] border-white/5 opacity-50 grayscale"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                    isActive
                      ? "bg-white text-blue-600 scale-110 shadow-lg"
                      : "bg-white/5 text-white/40"
                  }`}
                >
                  {ep.watched ? (
                    <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-500" />
                  ) : (
                    String(ep.number).padStart(2, "0")
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-bold truncate transition-colors ${isActive ? "text-white" : "text-white/70 group-hover:text-white"}`}
                  >
                    {ep.number}. {ep.title || "Episode " + ep.number}
                  </p>
                  <p
                    className={`text-[9px] truncate transition-colors font-medium flex items-center gap-2 ${isActive ? "text-white/60" : "text-white/30"}`}
                  >
                    {isDownloading && (
                      <span className="flex items-center gap-1.5 px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[8px] font-black text-blue-400 uppercase tracking-tighter animate-pulse">
                        <Loader2 className="w-2 h-2 animate-spin" />
                        Live Streaming
                      </span>
                    )}
                    {ep.isDownloaded && ep.localPath?.split("/").pop()}
                    {!ep.isDownloaded && (
                      <span className="text-white/20 italic">Nie pobrano</span>
                    )}
                  </p>
                </div>
                {isActive ? (
                  <Play className="w-4 h-4 text-white fill-white" />
                ) : !ep.isDownloaded ? (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(ep);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-[9px] font-black text-white uppercase tracking-wide transition-all shadow-md cursor-pointer select-none"
                  >
                    <Download className="w-3 h-3" />
                    Pobierz
                  </div>
                ) : (
                  <ChevronRight className="w-4 h-4 text-white/20 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                )}
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <MonitorPlay className="w-12 h-12 text-white/10 mb-4" />
            <p className="text-sm text-white/30 italic">
              Brak wspieranych plików wideo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
