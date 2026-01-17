import React from "react";

interface TorrentModalProps {
  episode: any;
  animeTitle: string;
  results: any[];
  isSearching: boolean;
  downloadingHash: string | null;
  onDownload: (magnet: string, hash: string) => void;
  onClose: () => void;
}

export const TorrentModal: React.FC<TorrentModalProps> = ({
  episode,
  animeTitle,
  results,
  isSearching,
  downloadingHash,
  onDownload,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-white">
      <div
        className="absolute inset-0 bg-[#050505]/80 backdrop-blur-xl"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black italic uppercase tracking-tighter">
              Szukaj Torrenta
            </h2>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">
              {animeTitle} — Odcinek {episode.number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all"
          >
            <div className="w-4 h-4 text-white/40">✕</div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {isSearching ? (
            <div className="py-20 flex flex-col items-center gap-6">
              <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 animate-pulse">
                Przeszukiwanie Nyaa.si...
              </p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-3">
              {results.map((t: any) => (
                <div
                  key={t.id}
                  className="group p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-2xl transition-all flex items-center justify-between gap-6"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                      {t.title}
                    </h4>
                    <div className="mt-2 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/20">
                      <span className="text-blue-500/60">{t.size}</span>
                      <span>{t.seeders} SEEDS</span>
                      <span
                        className={
                          t.isHEVC ? "text-purple-500/60" : "text-green-500/60"
                        }
                      >
                        {t.codec}
                      </span>
                    </div>
                  </div>
                  <button
                    disabled={downloadingHash === t.hash}
                    onClick={() => onDownload(t.magnet, t.hash)}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      downloadingHash === t.hash
                        ? "bg-white/5 text-white/20 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                    }`}
                  >
                    {downloadingHash === t.hash ? "Startowanie..." : "Pobierz"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-xs text-white/20 font-bold uppercase tracking-widest italic">
                Nie znaleziono odpowiednich torrentów
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
