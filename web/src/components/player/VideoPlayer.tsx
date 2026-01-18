import React, { useState } from "react";
import {
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Settings,
  Maximize,
  ListVideo,
} from "lucide-react";
import {
  MediaPlayer,
  MediaProvider,
  Track,
  Controls,
  TimeSlider,
  VolumeSlider,
  PlayButton,
  SeekButton,
  MuteButton,
  FullscreenButton,
  CaptionButton,
  Time,
  Gesture,
} from "@vidstack/react";
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
  const [controlsVisible, setControlsVisible] = useState(false);

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
          onControlsChange={(visible) => setControlsVisible(visible)}
          className="w-full h-full"
        >
          <MediaProvider>
            <Gesture event="pointerup" action="toggle:paused" />
            <Gesture event="dblpointerup" action="toggle:fullscreen" />
            <Gesture event="dblpointerup" action="seek:-10" />
            <Gesture event="dblpointerup" action="seek:10" />

            {/* Cinematic Vignette */}
            <AnimatePresence>
              {controlsVisible && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none"
                />
              )}
            </AnimatePresence>

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
          </MediaProvider>

          {/* Custom TV-inspired OSD */}
          <div
            className={`media-controls absolute inset-0 z-20 flex flex-col justify-end p-8 transition-opacity duration-500 ${controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            {/* Top Bar: Title & Playlist Toggle */}
            <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between pointer-events-auto">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={controlsVisible ? { y: 0, opacity: 1 } : {}}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <Play className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase italic tracking-tight text-white/90 leading-none">
                    {currentFile
                      ?.split("/")
                      .pop()
                      ?.replace(/\.(mkv|mp4|avi|mov)$/i, "")}
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mt-1">
                    Streaming w jakości HD
                  </p>
                </div>
              </motion.div>

              <button
                onClick={onToggleSidebar}
                className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all group"
              >
                <ListVideo className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Bottom Bar: Timeline & Controls */}
            <div className="flex flex-col gap-6 pointer-events-auto">
              <TimeSlider.Root className="vds-time-slider vds-slider group/slider relative mx-[7.5px] flex h-7 items-center cursor-pointer touch-none select-none outline-none">
                <TimeSlider.Track className="relative h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <TimeSlider.TrackFill className="vds-slider-fill absolute h-full w-[var(--slider-fill)] bg-blue-500 rounded-full" />
                  <TimeSlider.Progress className="vds-slider-progress absolute h-full w-[var(--slider-progress)] bg-white/5 rounded-full" />
                </TimeSlider.Track>
                <TimeSlider.Thumb className="vds-slider-thumb absolute left-[var(--slider-fill)] top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover/slider:opacity-100 transition-opacity shadow-lg z-20" />
              </TimeSlider.Root>

              <Controls.Group className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <PlayButton className="w-12 h-12 rounded-2xl bg-white text-black hover:bg-blue-500 hover:text-white flex items-center justify-center transition-colors group/play">
                    <Play className="w-6 h-6 fill-current vds-play-icon" />
                    <Pause className="w-6 h-6 fill-current vds-pause-icon" />
                  </PlayButton>
                  <SeekButton
                    seconds={-10}
                    className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center transition-colors text-white"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </SeekButton>
                  <SeekButton
                    seconds={10}
                    className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center transition-colors text-white"
                  >
                    <RotateCw className="w-5 h-5" />
                  </SeekButton>
                </div>

                <Time
                  className="text-xs font-black tracking-widest text-white/60"
                  type="current"
                />
                <div className="w-px h-4 bg-white/10" />
                <Time
                  className="text-xs font-black tracking-widest text-white/60"
                  type="duration"
                />

                <div className="flex-1" />

                <div className="flex items-center gap-4 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                  <MuteButton className="text-white hover:text-blue-500 transition-colors">
                    <Volume2 className="w-5 h-5" />
                  </MuteButton>
                  <VolumeSlider.Root className="vds-volume-slider vds-slider relative flex h-7 w-24 items-center cursor-pointer touch-none select-none outline-none">
                    <VolumeSlider.Track className="relative h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <VolumeSlider.TrackFill className="vds-slider-fill absolute h-full w-[var(--slider-fill)] bg-blue-500 rounded-full" />
                    </VolumeSlider.Track>
                    <VolumeSlider.Thumb className="vds-slider-thumb absolute left-[var(--slider-fill)] top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg z-20" />
                  </VolumeSlider.Root>
                </div>

                <CaptionButton className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center transition-colors text-white">
                  <Settings className="w-5 h-5" />
                </CaptionButton>

                <FullscreenButton className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all text-white">
                  <Maximize className="w-5 h-5" />
                </FullscreenButton>
              </Controls.Group>
            </div>
          </div>
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
