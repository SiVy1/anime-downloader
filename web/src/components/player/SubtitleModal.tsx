import React from "react";
import { Search, ArrowLeft, Subtitles, Download } from "lucide-react";

interface SubtitleModalProps {
  subtitles: any[];
  isSearching: boolean;
  onSelect: (sub: any) => void;
  onClose: () => void;
}

export const SubtitleModal: React.FC<SubtitleModalProps> = ({
  subtitles,
  isSearching,
  onSelect,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-8 border-b border-white/5 bg-[#121212]/50 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black flex items-center gap-3">
              <Search className="w-6 h-6 text-blue-500" />
              Wyszukaj Napisy
            </h3>
            <p className="text-xs text-white/40 mt-1">Wyniki z wielu źródeł</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 opacity-40 rotate-180" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {isSearching ? (
            [...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-white/5 rounded-2xl animate-pulse"
              />
            ))
          ) : subtitles.length > 0 ? (
            subtitles.map((sub) => (
              <button
                key={sub.id}
                onClick={() => onSelect(sub)}
                className="w-full flex items-center gap-4 p-4 bg-[#151515] hover:bg-[#1a1a1a] rounded-2xl border border-white/5 transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                  <Subtitles className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white/90 truncate">
                    {sub.attributes.release ||
                      sub.attributes.feature_details?.title ||
                      "Napisy"}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-white/40 font-bold uppercase tracking-wider">
                    <span
                      className={`px-1.5 py-0.5 rounded ring-1 ${sub.attributes.language === "pl" ? "bg-red-600/20 text-red-400" : "bg-blue-600/20 text-blue-400"}`}
                    >
                      {(sub.attributes.language || "en").toUpperCase()}
                    </span>
                    {sub.attributes.source && (
                      <span className="text-blue-500/80">
                        {sub.attributes.source}
                      </span>
                    )}
                  </div>
                </div>
                <Download className="w-4 h-4 text-white/20 group-hover:text-blue-500 transition-colors" />
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 opacity-30 text-center">
              <Search className="w-10 h-10 mb-4" />
              <p className="text-sm">
                Brak wyników lub nieprawidłowa konfiguracja API.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
