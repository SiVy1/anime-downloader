import React from "react";
import { ChevronRight } from "lucide-react";
import { MediaPlayer, MediaProvider, Track } from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";

interface VideoPlayerProps {
  playerRef: any;
  currentFile: string | null;
  streamUrl: string;
  streamType: string;
  subsLoadId: number;
  activeSkip: any;
  activeSub: string | null;
  internalSubs: any[];
  malId?: number;
  epNum?: string;
  folder: string;
  onTimeUpdate: (detail: { currentTime: number }) => void;
  onDurationChange: (duration: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  playerRef,
  currentFile,
  streamUrl,
  streamType,
  subsLoadId,
  activeSkip,
  activeSub,
  internalSubs,
  malId,
  epNum,
  folder,
  onTimeUpdate,
  onDurationChange,
}) => {
  return (
    <div className="relative aspect-video rounded-3xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] border border-white/5 bg-black mx-auto">
      {currentFile ? (
        <MediaPlayer
          key={`${currentFile}-${subsLoadId}`}
          ref={playerRef}
          title={currentFile}
          src={streamUrl}
          crossOrigin
          playsInline
          streamType="on-demand"
          minLiveDVRWindow={1}
          onTimeUpdate={onTimeUpdate}
          onDurationChange={onDurationChange}
        >
          <MediaProvider>
            {activeSkip && (
              <div className="absolute bottom-24 right-8 z-50 animate-in fade-in slide-in-from-right-4 duration-300">
                <button
                  onClick={() => {
                    if (playerRef.current) {
                      playerRef.current.currentTime =
                        activeSkip.interval.endTime;
                    }
                  }}
                  className="flex items-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-2xl border border-white/20 transition-all group active:scale-95"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                      Wykryto{" "}
                      {activeSkip.skipType === "op" ? "Opening" : "Ending"}
                    </span>
                    <span className="text-sm font-black uppercase italic">
                      Skip {activeSkip.skipType === "op" ? "Intro" : "Outro"}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
            {malId && epNum && (
              <Track
                key={`chapters-${malId}-${epNum}`}
                src={`/api/anime/skip-times/${malId}/${epNum}/chapters.vtt?episodeLength=${Math.floor(playerRef.current?.state?.duration || 0)}`}
                kind="chapters"
                default
              />
            )}
            {activeSub && (
              <Track
                key={activeSub}
                src={activeSub}
                label="Napisy Online"
                kind="subtitles"
                type="vtt"
                lang="pl"
                default
              />
            )}
            {internalSubs.map((sub, idx) => (
              <Track
                key={`${currentFile}-${sub.localIndex}`}
                src={`/api/subtitles/extract/${sub.localIndex}/${encodeURIComponent(folder)}/${encodeURIComponent(currentFile)}`}
                label={`${sub.title} [${sub.language}]`}
                kind="subtitles"
                type="vtt"
                lang={sub.language}
                default={idx === 0}
              />
            ))}
          </MediaProvider>
          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-white/5 to-transparent">
          <div className="w-20 h-20 text-white/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-full h-full"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <p className="text-white/20 font-medium">
            Wybierz odcinek z listy po prawej
          </p>
        </div>
      )}
    </div>
  );
};
