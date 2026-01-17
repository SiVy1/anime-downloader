import React from "react";
import {
  Star,
  Users,
  CheckCircle2,
  Info,
  Disc,
  Settings,
  RefreshCw,
} from "lucide-react";

interface PlayerInfoProps {
  currentFile: string | null;
  animeInfo: any;
  loadingInfo: boolean;
  isWatched: boolean;
  onToggleWatched: () => void;
  isConverting: boolean;
  convertProgress: number;
  isConverted: boolean;
  onStartConversion: () => void;
}

export const PlayerInfo: React.FC<PlayerInfoProps> = ({
  currentFile,
  animeInfo,
  loadingInfo,
  isWatched,
  onToggleWatched,
  isConverting,
  convertProgress,
  isConverted,
  onStartConversion,
}) => {
  return (
    <div className="mt-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white/5 rounded-[2rem] p-8 border border-white/10 backdrop-blur-md relative overflow-hidden group">
          {loadingInfo ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-white/10 rounded-lg w-1/3" />
              <div className="space-y-2">
                <div className="h-4 bg-white/5 rounded w-full" />
                <div className="h-4 bg-white/5 rounded w-full" />
              </div>
            </div>
          ) : animeInfo ? (
            <>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">
                  {animeInfo.title}
                </h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-black text-yellow-500">
                    {animeInfo.score || "N/A"}
                  </span>
                </div>
              </div>
              <p className="text-white/60 text-sm leading-relaxed line-clamp-4">
                {animeInfo.synopsis || "Brak opisu."}
              </p>
              <div className="flex flex-wrap gap-2 mt-6">
                {(animeInfo.genres || []).map((genre: any) => (
                  <span
                    key={genre.name}
                    className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 opacity-20">
              <Info className="w-12 h-12 mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">
                Metadata Unavailable
              </p>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-blue-600/10 to-transparent rounded-[2rem] p-8 border border-blue-500/10 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/60">
                Status
              </p>
              <p className="text-sm font-black uppercase tracking-tight">
                {animeInfo?.status || "Unknown"}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
              Episodes
            </span>
            <span className="text-xl font-black italic text-white/90">
              {animeInfo?.episodes || "??"}
            </span>
          </div>

          <button
            onClick={onToggleWatched}
            disabled={!currentFile}
            className={`mt-6 w-full py-3 rounded-xl border flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              isWatched
                ? "bg-green-500/20 border-green-500/30 text-green-500"
                : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isWatched ? "Obejrzano" : "Oznacz jako obejrzane"}
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-sm">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-blue-400">
            <Disc className="w-5 h-5" />
            Szczegóły pliku
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm py-2 border-b border-white/5">
              <span className="text-white/40">Nazwa:</span>
              <span className="text-white/80 font-medium truncate ml-4">
                {currentFile?.split("/").pop()}
              </span>
            </div>
            <div className="flex justify-between text-sm py-2">
              <span className="text-white/40">Format:</span>
              <span className="text-blue-400 font-bold uppercase">
                {currentFile?.split(".").pop()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600/10 to-transparent rounded-3xl p-6 border border-blue-500/10">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            Informacje o strumieniu
          </h2>
          {currentFile?.toLowerCase().endsWith(".mkv") && (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/70">
                  Konwersja MKV → MP4
                </span>
                {isConverted && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Gotowe
                  </span>
                )}
              </div>
              {isConverting ? (
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${convertProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-medium text-white/30">
                    <span>Przetwarzanie pliku...</span>
                    <span>{Math.round(convertProgress)}%</span>
                  </div>
                </div>
              ) : (
                !isConverted && (
                  <button
                    onClick={onStartConversion}
                    className="w-full py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Konwertuj teraz
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
