"use client";

import { Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAnimeDetails } from "@/hooks/useAnimeDetails";
import { AnimeHeader } from "@/components/anime/AnimeHeader";
import { EpisodeList } from "@/components/anime/EpisodeList";
import { TorrentModal } from "@/components/anime/TorrentModal";
import { LinkModal } from "@/components/anime/LinkModal";

export default function AnimeDetailPage() {
  const router = useRouter();
  const {
    anime,
    episodes,
    loading,
    error,
    // Actions
    addToLibrary,
    isAddingToLibrary,
    // Linking
    showLinkModal,
    setShowLinkModal,
    availableFolders,
    isLinking,
    linkFolder,
    // Torrents
    searchingEp,
    setSearchingEp,
    torrentResults,
    isSearchingTorrents,
    downloadingHash,
    startSearchTorrent,
    startDownload,
  } = useAnimeDetails();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-xs font-black uppercase tracking-[0.3em] text-white/20 animate-pulse">
            Ładowanie metadanych...
          </p>
        </div>
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <Info className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-xl font-black uppercase italic mb-2">
          Wystąpił błąd
        </h1>
        <p className="text-sm text-white/40 mb-8">
          {error || "Nie znaleziono anime"}
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
        >
          Powrót do biblioteki
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">
      <AnimeHeader
        anime={anime}
        isAddingToLibrary={isAddingToLibrary}
        onAdd={addToLibrary}
        onBack={() => router.back()}
      />

      <EpisodeList
        episodes={episodes}
        episodesCount={anime.episodesCount}
        onSearchTorrent={startSearchTorrent}
      />

      {searchingEp && (
        <TorrentModal
          episode={searchingEp}
          animeTitle={anime.title}
          results={torrentResults}
          isSearching={isSearchingTorrents}
          downloadingHash={downloadingHash}
          onDownload={startDownload}
          onClose={() => setSearchingEp(null)}
        />
      )}

      {showLinkModal && (
        <LinkModal
          folders={availableFolders}
          isLinking={isLinking}
          onLink={linkFolder}
          onClose={() => setShowLinkModal(false)}
        />
      )}
    </div>
  );
}
