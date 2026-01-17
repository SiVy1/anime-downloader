"use client";

import { ArrowLeft, Subtitles } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { PlaylistSidebar } from "@/components/player/PlaylistSidebar";
import { PlayerInfo } from "@/components/player/PlayerInfo";
import { SubtitleModal } from "@/components/player/SubtitleModal";
import { TorrentModal } from "@/components/anime/TorrentModal"; // Reusing the one from Task 1

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
    isSearchingSubs,
    showSubModal,
    setShowSubModal,
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
          <button
            onClick={searchSubtitles}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-blue-600/20 rounded-xl border border-white/5 transition-all text-sm font-medium"
          >
            <Subtitles className="w-4 h-4" />
            Napisy Online
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 overflow-hidden">
        <div className="lg:col-span-3 p-4 lg:p-8 overflow-y-auto custom-scrollbar">
          <VideoPlayer
            playerRef={playerRef}
            currentFile={currentFile}
            streamUrl={streamUrl}
            streamType={streamType}
            subsLoadId={subsLoadId}
            activeSkip={activeSkip}
            activeSub={activeSub}
            internalSubs={internalSubs}
            malId={animeInfo?.mal_id}
            epNum={episodes
              .find((e) => e.localPath === currentFile)
              ?.number?.toString()}
            folder={folder as string}
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleDurationChange}
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
        </div>

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
      </div>

      {showSubModal && (
        <SubtitleModal
          subtitles={subtitles}
          isSearching={isSearchingSubs}
          onSelect={selectSubtitle}
          onClose={() => setShowSubModal(false)}
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
