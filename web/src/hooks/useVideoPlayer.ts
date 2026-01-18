import { useState, useEffect, useRef, useCallback } from "react";

export function useVideoPlayer(folder: string) {
  const decodedFolder = decodeURIComponent(folder);

  const [episodes, setEpisodes] = useState<any[]>([]);
  const [anime, setAnime] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentFile, setCurrentFile] = useState<string | null>(null);

  // Jikan state
  const [animeInfo, setAnimeInfo] = useState<any | null>(null);
  const [episodesInfo, setEpisodesInfo] = useState<any[]>([]);
  const [loadingInfo, setLoadingInfo] = useState(true);

  // Subtitles state
  const [subtitles, setSubtitles] = useState<any[]>([]);
  const [internalSubs, setInternalSubs] = useState<any[]>([]);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [subOffset, setSubOffset] = useState(0);
  const [isSearchingSubs, setIsSearchingSubs] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);

  // Conversion state
  const [isConverting, setIsConverting] = useState(false);
  const [convertProgress, setConvertProgress] = useState(0);
  const [isConverted, setIsConverted] = useState(false);

  // Live Stream state
  const [downloadingFiles, setDownloadingFiles] = useState<string[]>([]);

  // Torrent Search state
  const [searchingEp, setSearchingEp] = useState<any | null>(null);
  const [torrentResults, setTorrentResults] = useState<any[]>([]);
  const [isSearchingTorrents, setIsSearchingTorrents] = useState(false);
  const [downloadingHash, setDownloadingHash] = useState<string | null>(null);

  const [skipTimes, setSkipTimes] = useState<any[]>([]);
  const [activeSkip, setActiveSkip] = useState<any | null>(null);
  const [duration, setDuration] = useState(0);

  const playerRef = useRef<any>(null);

  const fetchLibraryData = useCallback(async () => {
    try {
      const res = await fetch(`/api/library/${folder}`);
      const data = await res.json();
      if (data.anime) {
        setAnime(data.anime);
        if (data.anime.mal_id) setAnimeInfo(data.anime);
      }
      if (data.episodes) {
        setEpisodes(data.episodes);
        const firstDownloaded = data.episodes.find((e: any) => e.isDownloaded);
        if (firstDownloaded && !currentFile) {
          setCurrentFile(firstDownloaded.localPath);
        }
      }
      if (data.downloadingFiles) {
        setDownloadingFiles(data.downloadingFiles);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, [folder, currentFile]);

  const fetchMetadata = useCallback(async () => {
    try {
      setLoadingInfo(true);
      const searchRes = await fetch(
        `/api/anime/search?q=${encodeURIComponent(decodedFolder)}`,
      );
      const searchData = await searchRes.json();
      if (searchData.results && searchData.results.length > 0) {
        const bestMatch = searchData.results[0];
        setAnimeInfo(bestMatch);
        const detailRes = await fetch(`/api/anime/${bestMatch.mal_id}`);
        const detailData = await detailRes.json();
        if (detailData.episodes) setEpisodesInfo(detailData.episodes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInfo(false);
    }
  }, [decodedFolder]);

  useEffect(() => {
    fetchLibraryData();
    fetchMetadata();
  }, [fetchLibraryData, fetchMetadata]);

  // Codec/Subs Metadata
  const [codecInfo, setCodecInfo] = useState<any>(null);
  const [subsLoadId, setSubsLoadId] = useState(0);

  useEffect(() => {
    if (currentFile) {
      setInternalSubs([]);
      setCodecInfo(null);
      setActiveSub(null);
      setSubtitles([]);

      fetch(
        `/api/subtitles/metadata/${encodeURIComponent(decodedFolder)}/${encodeURIComponent(currentFile || "")}`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.subtitles) {
            setInternalSubs(data.subtitles);
            setSubsLoadId((prev) => prev + 1);
          }
          if (data.codecs) setCodecInfo(data.codecs);
        })
        .catch((err) => console.error(err));
    }
  }, [currentFile, folder]);

  // Skip Times
  useEffect(() => {
    if (!animeInfo?.mal_id || !currentFile || duration === 0) return;
    const ep = episodes.find((e) => e.localPath === currentFile);
    const epNum = ep?.number;
    if (!epNum) return;

    const fetchSkipTimes = async () => {
      try {
        const res = await fetch(
          `/api/anime/skip-times/${animeInfo.mal_id}/${epNum}?episodeLength=${Math.floor(duration)}`,
          {
            headers: {
              "X-Client-ID": "ZGfO0sMF3eCwLYf8yMSCJjlynwNGRXWE",
            },
          },
        );
        const data = await res.json();
        if (data.found) setSkipTimes(data.results);
        else setSkipTimes([]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSkipTimes();
  }, [animeInfo?.mal_id, currentFile, episodes, duration]);

  const handleDurationChange = (duration: number) => {
    setDuration(duration);
  };

  const handleTimeUpdate = (detail: { currentTime: number }) => {
    const time = detail.currentTime;
    const skip = skipTimes.find(
      (s) => time >= s.interval.startTime && time <= s.interval.endTime,
    );
    setActiveSkip(skip || null);
  };

  const isMp4 = currentFile?.toLowerCase().endsWith(".mp4");
  const canDirectPlay = codecInfo ? codecInfo.canDirectPlay : isMp4;
  const streamType = canDirectPlay ? "direct" : "transcode";
  const streamUrl = currentFile
    ? canDirectPlay
      ? `/api/stream-direct/${encodeURIComponent(decodedFolder)}/${encodeURIComponent(currentFile)}`
      : `/api/stream/${encodeURIComponent(decodedFolder)}/${encodeURIComponent(currentFile)}`
    : "";

  const searchSubtitles = async () => {
    if (!currentFile) return;
    setIsSearchingSubs(true);
    setShowSubModal(true);
    const query =
      currentFile
        .split("/")
        .pop()
        ?.replace(/\.(mkv|mp4|avi|mov)$/i, "") || currentFile;
    try {
      const res = await fetch(
        `/api/subtitles/search?q=${encodeURIComponent(query)}`,
      );
      const data = await res.json();
      setSubtitles(data.subtitles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingSubs(false);
    }
  };

  const selectSubtitle = (sub: any) => {
    let subUrl = "";
    if (sub.attributes.url) subUrl = sub.attributes.url;
    else if (sub.attributes.files && sub.attributes.files[0]) {
      subUrl = `/api/subtitles/download?file_id=${sub.attributes.files[0].file_id}`;
    }
    if (subUrl) {
      setActiveSub(subUrl);
      setShowSubModal(false);
    }
  };

  const toggleWatched = async (episodeId: string) => {
    try {
      const res = await fetch(`/api/episodes/${episodeId}/watch`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setEpisodes((prev) =>
          prev.map((ep) =>
            ep._id === episodeId ? { ...ep, watched: data.watched } : ep,
          ),
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startConversion = async () => {
    if (!currentFile || !currentFile.toLowerCase().endsWith(".mkv")) return;
    setIsConverting(true);
    try {
      const res = await fetch(
        `/api/convert/${folder}/${encodeURIComponent(currentFile)}`,
        { method: "POST" },
      );
      const data = await res.json();
      if (data.status === "completed") {
        setIsConverted(true);
        setIsConverting(false);
        window.location.reload();
      } else {
        const interval = setInterval(async () => {
          const sRes = await fetch(
            `/api/convert/${folder}/${encodeURIComponent(currentFile || "")}`,
          );
          const sData = await sRes.json();
          setConvertProgress(sData.progress || 0);
          if (sData.status === "completed") {
            clearInterval(interval);
            window.location.reload();
          }
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setIsConverting(false);
    }
  };

  const searchTorrentsForEpisode = async (episode: any) => {
    setSearchingEp(episode);
    setIsSearchingTorrents(true);
    setTorrentResults([]);
    const title = anime?.title || animeInfo?.title || decodedFolder;
    try {
      const res = await fetch(
        `/api/downloader/search-episode?title=${encodeURIComponent(title)}&episode=${episode.number}`,
      );
      const data = await res.json();
      setTorrentResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingTorrents(false);
    }
  };

  const startDownload = async (magnet: string, hash: string) => {
    setDownloadingHash(hash);
    try {
      await fetch("/api/downloader/download-magnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ magnet, subfolder: decodedFolder }),
      });
      setSearchingEp(null);
      // We don't reload here as we'll wait for qBit to pick it up and refresh library normally
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingHash(null);
    }
  };

  return {
    loading,
    anime,
    episodes,
    currentFile,
    setCurrentFile,
    animeInfo,
    episodesInfo,
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
    skipTimes,
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
  };
}
