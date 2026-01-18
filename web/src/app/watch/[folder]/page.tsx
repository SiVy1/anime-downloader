"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { PlaylistSidebar } from "@/components/player/PlaylistSidebar";
import { PlayerInfo } from "@/components/player/PlayerInfo";
import { SubtitleModal } from "@/components/player/SubtitleModal";
import { AudioTrackSelector } from "@/components/player/AudioTrackSelector";
import { TorrentModal } from "@/components/anime/TorrentModal";
import ReleaseProfileModal from "@/components/anime/ReleaseProfileModal";
import { toast } from "sonner";
import {
  ArrowLeft,
  RefreshCw,
  Download,
  Subtitles,
  CheckCircle2,
  Bell,
  BellOff,
  Settings,
  Volume2,
} from "lucide-react";

export default function WatchPage() {
  const { folder } = useParams();
  const decodedFolder = decodeURIComponent(folder as string);

  const {
    loading,
    anime,
    episodes,
    currentFile,
    setCurrentFile,
    animeInfo,
    loadingInfo,
    subtitles,
    internalSubs,
    activeSub,
    setActiveSub,
    subOffset,
    setSubOffset,
    isSearchingSubs,
    showSubModal,
    setShowSubModal,
    audioTracks,
    activeAudioTrack,
    setActiveAudioTrack,
    isConverting,
    convertProgress,
    isConverted,
    downloadingFiles,
    searchingEp,
    setSearchingEp,
    torrentResults,
    isSearchingTorrents,
    downloadingHash,
    activeSkip,
    playerRef,
    subsLoadId,
    codecInfo,
    streamUrl,
    streamType,
    handleTimeUpdate,
    handleDurationChange,
    searchSubtitles,
    selectSubtitle,
    toggleWatched,
    startConversion,
    searchTorrentsForEpisode,
    startDownload,
  } = useVideoPlayer(folder as string);

  const [showSidebar, setShowSidebar] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAudioDropdown, setShowAudioDropdown] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [togglingSubscription, setTogglingSubscription] = useState(false);
  const audioDropdownRef = useRef<HTMLDivElement>(null);

  // Close audio dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (audioDropdownRef.current && !audioDropdownRef.current.contains(event.target as Node)) {
        setShowAudioDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch subscription status when anime loads
  useEffect(() => {
    if (anime?.isSubscribed !== undefined) {
      setIsSubscribed(anime.isSubscribed);
    }
  }, [anime]);

  const toggleSubscription = async () => {
    if (!animeInfo?.anilistId) return;
    setTogglingSubscription(true);
    try {
      const res = await fetch(`/api/anime/${animeInfo.anilistId}/subscribe`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setIsSubscribed(data.isSubscribed);
        toast.success(
          data.isSubscribed
            ? "Auto-pobieranie włączone"
            : "Auto-pobieranie wyłączone",
        );
      }
    } catch (error) {
      toast.error("Nie udało się zmienić subskrypcji");
    } finally {
      setTogglingSubscription(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col">
      {/* Top Header */}
      <div className="bg-[#0a0a0a]/40 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${streamType === "direct" ? "bg-green-500" : "bg-blue-500"}`}
              ></span>
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">
                {streamType === "direct"
                  ? `Direct Play (${codecInfo?.video?.toUpperCase() || ""})`
                  : "Transcoding"}
              </span>
            </div>
            <h1 className="text-sm font-bold line-clamp-1 max-w-[400px] text-white/90">
              {decodedFolder}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AnimatePresence>
            {(downloadingFiles.length > 0 || isConverting) && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-3 px-5 py-2.5 bg-blue-600/10 border border-blue-500/20 rounded-2xl mr-2 group/hub relative cursor-default"
              >
                <div className="relative">
                  <RefreshCw
                    className={`w-4 h-4 text-blue-500 ${isConverting || downloadingFiles.length > 0 ? "animate-spin" : ""}`}
                  />
                  <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-[#050505]">
                    <span className="text-[7px] font-black text-white">
                      {downloadingFiles.length + (isConverting ? 1 : 0)}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                  {isConverting ? "Przetwarzanie..." : "Zadania w tle"}
                </span>

                {/* Popover Hub */}
                <div className="absolute top-full right-0 mt-4 w-80 bg-[#0f0f0f] border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 opacity-0 translate-y-2 pointer-events-none group-hover/hub:opacity-100 group-hover/hub:translate-y-0 group-hover/hub:pointer-events-auto transition-all z-[100] backdrop-blur-3xl">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6 border-b border-white/5 pb-3">
                    Centrum Aktywności
                  </h4>
                  <div className="space-y-5">
                    {isConverting && (
                      <div className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <span className="text-white/60 flex items-center gap-2">
                            <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />{" "}
                            Konwersja Wideo
                          </span>
                          <span className="text-blue-500">
                            {Math.round(convertProgress)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${convertProgress}%` }}
                            className="h-full bg-blue-500"
                          />
                        </div>
                      </div>
                    )}
                    {downloadingFiles.length > 0 && (
                      <div className="space-y-3">
                        {downloadingFiles.map((file, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group/file"
                          >
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                              <Download className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-tight text-white/80 truncate mb-1">
                                {file.split("/").pop()}
                              </p>
                              <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                                Pobieranie...
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {downloadingFiles.length === 0 && !isConverting && (
                      <div className="py-10 text-center space-y-3">
                        <CheckCircle2 className="w-10 h-10 text-white/5 mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/10">
                          Wszystkie zadania ukończone
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Subscription & Settings */}
          {animeInfo?.anilistId && (
            <>
              <button
                onClick={toggleSubscription}
                disabled={togglingSubscription}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all group shadow-xl ${
                  isSubscribed
                    ? "bg-blue-600/10 border-blue-500/30 text-blue-400"
                    : "bg-white/5 border-white/5 text-white/40 hover:bg-blue-600/10 hover:border-blue-500/30"
                }`}
                title={
                  isSubscribed
                    ? "Wyłącz auto-pobieranie"
                    : "Włącz auto-pobieranie"
                }
              >
                {isSubscribed ? (
                  <Bell className="w-4 h-4" />
                ) : (
                  <BellOff className="w-4 h-4" />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                  {isSubscribed ? "Subskrybujesz" : "Subskrybuj"}
                </span>
              </button>
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group shadow-xl"
                title="Ustawienia profilu wydania"
              >
                <Settings className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
              </button>
            </>
          )}

          {/* Audio Track Selector */}
          {audioTracks.length > 1 && (
            <div className="relative" ref={audioDropdownRef}>
              <button
                onClick={() => setShowAudioDropdown(!showAudioDropdown)}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all group shadow-xl ${
                  showAudioDropdown
                    ? "bg-blue-600/10 border-blue-500/30"
                    : "bg-white/5 hover:bg-blue-600/10 border-white/5 hover:border-blue-500/30"
                }`}
              >
                <Volume2 className={`w-4 h-4 transition-colors ${showAudioDropdown ? "text-blue-500" : "text-white/40 group-hover:text-blue-500"}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">
                  Audio ({audioTracks[activeAudioTrack]?.language?.toUpperCase() || "?"})
                </span>
              </button>
              <AnimatePresence>
                {showAudioDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl p-4 z-50"
                  >
                    <AudioTrackSelector
                      audioTracks={audioTracks}
                      activeTrack={activeAudioTrack}
                      onSelect={(idx) => {
                        setActiveAudioTrack(idx);
                        setShowAudioDropdown(false);
                        toast.success(`Zmieniono ścieżkę audio na: ${audioTracks[idx]?.title || `Audio ${idx + 1}`}`);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <button
            onClick={searchSubtitles}
            className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-blue-600/10 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all group shadow-xl"
          >
            <Subtitles className="w-4 h-4 text-white/40 group-hover:text-blue-500 transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">
              Napisy Online
            </span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div
          className={`flex-1 p-4 lg:p-8 overflow-y-auto custom-scrollbar transition-all duration-500 ${showSidebar ? "lg:mr-0" : "lg:mr-0"}`}
        >
          <VideoPlayer
            playerRef={playerRef}
            currentFile={currentFile}
            streamUrl={streamUrl}
            streamType={streamType}
            subsLoadId={subsLoadId}
            activeSkip={activeSkip}
            activeSub={activeSub}
            internalSubs={internalSubs}
            anilistId={animeInfo?.anilistId}
            epNum={episodes
              .find((e) => e.localPath === currentFile)
              ?.number?.toString()}
            folder={decodedFolder}
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleDurationChange}
            onToggleSidebar={() => setShowSidebar(!showSidebar)}
          />

          <PlayerInfo
            currentFile={currentFile}
            animeInfo={animeInfo}
            loadingInfo={loadingInfo}
            isWatched={
              episodes.find((e) => e.localPath === currentFile)?.watched ||
              false
            }
            onToggleWatched={() => {
              const currentEp = episodes.find(
                (e) => e.localPath === currentFile,
              );
              if (currentEp) toggleWatched(currentEp._id);
            }}
            isConverting={isConverting}
            convertProgress={convertProgress}
            isConverted={isConverted}
            onStartConversion={startConversion}
          />

          {/* Mobile Playlist Section */}
          <div className="mt-20 lg:hidden border-t border-white/5 pt-12 pb-24">
            <h3 className="text-sm font-black italic uppercase tracking-[0.3em] text-white/30 mb-8 flex items-center gap-3">
              <div className="w-8 h-px bg-white/20" />
              Playlist / {episodes.length} Odcinków
            </h3>
            <PlaylistSidebar
              episodes={episodes}
              currentFile={currentFile}
              onSelect={(file) => {
                setCurrentFile(file);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onDownload={searchTorrentsForEpisode}
              downloadingFiles={downloadingFiles}
              loading={loading}
              isMobile={true}
            />
          </div>
        </div>

        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="hidden lg:block w-[380px] border-l border-white/5 bg-[#080808] shrink-0"
            >
              <PlaylistSidebar
                episodes={episodes}
                currentFile={currentFile}
                onSelect={(file) => {
                  setCurrentFile(file);
                }}
                onDownload={searchTorrentsForEpisode}
                downloadingFiles={downloadingFiles}
                loading={loading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showSubModal && (
        <SubtitleModal
          subtitles={subtitles}
          isSearching={isSearchingSubs}
          onSelect={selectSubtitle}
          onClose={() => setShowSubModal(false)}
          currentOffset={subOffset}
          onOffsetChange={setSubOffset}
        />
      )}

      {searchingEp && (
        <TorrentModal
          episode={searchingEp}
          animeTitle={anime?.title || animeInfo?.title || decodedFolder}
          results={torrentResults}
          isSearching={isSearchingTorrents}
          downloadingHash={downloadingHash}
          onDownload={startDownload}
          onClose={() => setSearchingEp(null)}
        />
      )}

      {showProfileModal && animeInfo?.anilistId && (
        <ReleaseProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          anilistId={animeInfo.anilistId}
          animeTitle={anime?.title || animeInfo?.title || decodedFolder}
        />
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .vds-video-layout {
          --video-brand: #2563eb;
        }
        .vds-player {
          background-color: black !important;
        }
        .vds-captions {
          font-size: 1.5rem !important;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9) !important;
        }
        .vds-captions [data-part="cue"] {
          background: rgba(0, 0, 0, 0.75) !important;
          padding: 0.25rem 0.5rem !important;
          border-radius: 4px !important;
        }
      `}</style>
    </div>
  );
}
