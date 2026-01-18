import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

export function useAnimeDetails() {
  const params = useParams();
  const id = params.id;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Library state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [availableFolders, setAvailableFolders] = useState<string[]>([]);
  const [isLinking, setIsLinking] = useState(false);

  // Torrent Search state
  const [searchingEp, setSearchingEp] = useState<any>(null);
  const [torrentResults, setTorrentResults] = useState<any[]>([]);
  const [isSearchingTorrents, setIsSearchingTorrents] = useState(false);
  const [downloadingHash, setDownloadingHash] = useState<string | null>(null);
  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false);

  const fetchAnimeData = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/anime/${id}`);
      const d = await res.json();
      if (d.error) setError(d.error);
      else setData(d);
    } catch (err) {
      console.error(err);
      setError("Błąd połączenia z serwerem");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAnimeData();
  }, [fetchAnimeData]);

  const addToLibrary = async () => {
    setIsAddingToLibrary(true);
    try {
      const res = await fetch(`/api/anime/${id}/add`, {
        method: "POST",
      });
      const resData = await res.json();
      if (resData.success) {
        await fetchAnimeData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingToLibrary(false);
    }
  };

  const openLinkModal = async () => {
    setShowLinkModal(true);
    try {
      const res = await fetch("/api/library");
      const d = await res.json();
      if (d.folders) setAvailableFolders(d.folders);
    } catch (err) {
      console.error(err);
    }
  };

  const linkFolder = async (folderName: string) => {
    setIsLinking(true);
    try {
      const res = await fetch(`/api/anime/${id}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName }),
      });
      const resData = await res.json();
      if (resData.success) {
        setShowLinkModal(false);
        await fetchAnimeData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLinking(false);
    }
  };

  const startSearchTorrent = (episode: any) => {
    setSearchingEp(episode);
    setTorrentResults([]);
    const title = data.anime.title || "";
    const romaji = data.anime.titleRomaji || "";

    fetch(
      `/api/downloader/search-episode?title=${encodeURIComponent(title)}&romaji=${encodeURIComponent(romaji)}&episode=${episode.number}`,
    )
      .then((res) => res.json())
      .then((d) => {
        setTorrentResults(d.results || []);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setIsSearchingTorrents(false);
      });
  };

  const startDownload = async (magnet: string, hash: string) => {
    setDownloadingHash(hash);
    try {
      const folderName = data.anime.localFolderName || data.anime.title;
      await fetch("/api/downloader/download-magnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          magnet: [magnet],
          subfolder: folderName,
        }),
      });

      if (!data.anime.localFolderName) {
        await linkFolder(folderName);
      }

      alert("Pobieranie rozpoczęte!");
      setSearchingEp(null);
    } catch (err) {
      console.error(err);
      alert("Błąd podczas uruchamiania pobierania");
    } finally {
      setDownloadingHash(null);
    }
  };

  return {
    anime: data?.anime,
    episodes: data?.episodes,
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
    openLinkModal,
    linkFolder,
    // Torrents
    searchingEp,
    setSearchingEp,
    torrentResults,
    isSearchingTorrents,
    downloadingHash,
    startSearchTorrent,
    startDownload,
  };
}
