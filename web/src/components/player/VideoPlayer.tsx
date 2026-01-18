import React from "react";
import { ChevronRight } from "lucide-react";
import { MediaPlayer, MediaProvider, Track, Gesture } from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import { motion, AnimatePresence } from "framer-motion";

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
  onToggleSidebar: () => void;
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
  onToggleSidebar,
}) => {
  return (
    <div className="relative aspect-video rounded-3xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] border border-white/5 bg-black mx-auto group/player">
      {currentFile ? (
        <MediaPlayer
          key={`${currentFile}-${subsLoadId}`}
          ref={playerRef}
          title={currentFile}
          src={streamUrl}
          crossOrigin
          playsInline
          streamType={streamType === "live" ? "live:dvr" : "on-demand"}
          minLiveDVRWindow={streamType.includes("live") ? 1 : undefined}
          onTimeUpdate={onTimeUpdate}
          onDurationChange={onDurationChange}
          className="w-full h-full"
        >
          <MediaProvider>
            <Gesture event="pointerup" action="toggle:paused" />
            <Gesture event="dblpointerup" action="toggle:fullscreen" />
            <Gesture event="dblpointerup" action="seek:-10" />
            <Gesture event="dblpointerup" action="seek:10" />

            {/* Custom Skip Intro/Outro */}
            <AnimatePresence>
              {activeSkip && (
                <motion.div
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 40, opacity: 0 }}
                  transition={{ type: "spring", damping: 20 }}
                  className="absolute bottom-32 right-8 z-50"
                >
                  <button
                    onClick={() => {
                      if (playerRef.current) {
                        playerRef.current.currentTime =
                          activeSkip.interval.endTime;
                      }
                    }}
                    className="flex items-center gap-4 pl-6 pr-4 py-4 bg-white text-black hover:bg-blue-500 hover:text-white rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-white/10 transition-all group active:scale-95"
                  >
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 group-hover:opacity-60 transition-opacity">
                        Wykryto{" "}
                        {activeSkip.skipType === "op" ? "Opening" : "Ending"}
                      </span>
                      <span className="text-base font-black uppercase italic tracking-tighter mt-0.5">
                        Skip {activeSkip.skipType === "op" ? "Intro" : "Outro"}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-black/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
                      <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chapters & Subs */}
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
            <DefaultVideoLayout icons={defaultLayoutIcons} />
          </MediaProvider>
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
