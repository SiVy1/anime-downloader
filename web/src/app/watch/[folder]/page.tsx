"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play,
  ArrowLeft,
  Disc,
  ChevronRight,
  MonitorPlay,
  Settings,
  Subtitles,
  Search,
  Download,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Info,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { JikanAnime, JikanEpisode } from "@/lib/jikanService";

// Vidstack Core & React
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import {
  MediaPlayer,
  MediaProvider,
  Track,
  Poster,
  Captions,
} from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";

export default function WatchPage() {
  const { folder } = useParams();
  const decodedFolder = decodeURIComponent(folder as string);

  const [episodes, setEpisodes] = useState<any[]>([]);
  const [anime, setAnime] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [files, setFiles] = useState<string[]>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);

  // Jikan state
  const [animeInfo, setAnimeInfo] = useState<JikanAnime | null>(null);
  const [episodesInfo, setEpisodesInfo] = useState<JikanEpisode[]>([]);
  const [loadingInfo, setLoadingInfo] = useState(true);

  // Subtitles state
  const [subtitles, setSubtitles] = useState<any[]>([]);
  const [internalSubs, setInternalSubs] = useState<any[]>([]);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [isSearchingSubs, setIsSearchingSubs] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);

  // Conversion state
  const [isConverting, setIsConverting] = useState(false);
  const [convertProgress, setConvertProgress] = useState(0);
  const [isConverted, setIsConverted] = useState(false);

  // Live Stream state
  const [downloadingFiles, setDownloadingFiles] = useState<string[]>([]);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [setIsLiveModeState, setIsLiveModeAction] = useState(false); // Helper to avoid name collision if any

  // Torrent Search state
  const [searchingEp, setSearchingEp] = useState<any | null>(null);
  const [torrentResults, setTorrentResults] = useState<any[]>([]);
  const [isSearchingTorrents, setIsSearchingTorrents] = useState(false);
  const [downloadingHash, setDownloadingHash] = useState<string | null>(null);

  const player = useRef<any>(null);

  useEffect(() => {
    fetch(`/api/library/${folder}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.anime) {
          setAnime(data.anime);
          setAnimeInfo(data.anime); // Fallback to Jikan structure
        }
        if (data.episodes) {
          setEpisodes(data.episodes);
          // Set initial file if not set
          const firstDownloaded = data.episodes.find(
            (e: any) => e.isDownloaded,
          );
          if (firstDownloaded && !currentFile) {
            setCurrentFile(firstDownloaded.localPath);
          }
        } else if (data.files) {
          // Legacy fallback
          setFiles(data.files);
          if (data.files.length > 0 && !currentFile)
            setCurrentFile(data.files[0]);
        }

        if (data.downloadingFiles) {
          setDownloadingFiles(data.downloadingFiles);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

    // Fetch Jikan info via API
    const fetchMetadata = async () => {
      try {
        setLoadingInfo(true);
        // 1. Find best match via search API
        const searchRes = await fetch(
          `/api/anime/search?q=${encodeURIComponent(decodedFolder)}`,
        );
        const searchData = await searchRes.json();

        if (searchData.results && searchData.results.length > 0) {
          const bestMatch = searchData.results[0];
          setAnimeInfo(bestMatch);

          // 2. Get full details and episodes via detail API
          const detailRes = await fetch(`/api/anime/${bestMatch.mal_id}`);
          const detailData = await detailRes.json();
          if (detailData.episodes) {
            setEpisodesInfo(detailData.episodes);
          }
        }
      } catch (err) {
        console.error("Metadata fetch error:", err);
      } finally {
        setLoadingInfo(false);
      }
    };

    fetchMetadata();
  }, [folder, decodedFolder]);

  // Pobieranie wewnętrznych napisów gdy zmieni się plik
  useEffect(() => {
    if (currentFile) {
      setInternalSubs([]);
      fetch(
        `/api/subtitles/metadata/${folder}/${encodeURIComponent(currentFile)}`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.subtitles) {
            setInternalSubs(data.subtitles);
          }
        })
        .catch((err) => console.error("Metadata fetch error:", err));
    }
  }, [currentFile, folder]);

  const currentIsDownloading = currentFile
    ? downloadingFiles.some((df) => df.endsWith(currentFile))
    : false;

  const streamUrl = currentFile
    ? isLiveMode
      ? `/api/stream-live/${folder}/${encodeURIComponent(currentFile)}`
      : `/api/stream/${folder}/${encodeURIComponent(currentFile)}`
    : "";

  const searchSubtitles = async () => {
    if (!currentFile) return;
    setIsSearchingSubs(true);
    setShowSubModal(true);

    // Używamy samej nazwy pliku bez ścieżek i rozszerzenia do lepszych wyników
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
    const subUrl = `/api/subtitles/download?file_id=${sub.attributes.files[0].file_id}`;
    setActiveSub(subUrl);
    setShowSubModal(false);
  };

  // Status check on mount/file change
  useEffect(() => {
    if (currentFile && currentFile.toLowerCase().endsWith(".mkv")) {
      const checkStatus = async () => {
        try {
          const res = await fetch(
            `/api/convert/${folder}/${encodeURIComponent(currentFile)}`,
          );
          const data = await res.json();

          if (data.status === "completed") {
            setIsConverted(true);
            setIsConverting(false);
          } else if (data.status === "in_progress") {
            setIsConverting(true);
            setConvertProgress(data.progress || 0);
            startPolling();
          } else {
            setIsConverted(false);
            setIsConverting(false);
          }
        } catch (err) {
          console.error("Status check error:", err);
        }
      };

      checkStatus();
    } else {
      setIsConverted(false);
      setIsConverting(false);
    }
  }, [currentFile, folder]);

  const startPolling = () => {
    const pollInterval = setInterval(async () => {
      try {
        const statusRes = await fetch(
          `/api/convert/${folder}/${encodeURIComponent(currentFile || "")}`,
        );
        const statusData = await statusRes.json();

        setConvertProgress(statusData.progress || 0);

        if (statusData.status === "completed") {
          clearInterval(pollInterval);
          setIsConverting(false);
          setIsConverted(true);
          window.location.reload();
        } else if (statusData.status === "not_started") {
          clearInterval(pollInterval);
          setIsConverting(false);
        }
      } catch (err) {
        console.error("Polling error:", err);
        clearInterval(pollInterval);
      }
    }, 2000);
    return pollInterval;
  };

  // Start MKV to MP4 conversion
  const startConversion = async () => {
    if (!currentFile || !currentFile.toLowerCase().endsWith(".mkv")) return;

    setIsConverting(true);
    setConvertProgress(0);

    try {
      // Start conversion
      const res = await fetch(
        `/api/convert/${folder}/${encodeURIComponent(currentFile)}`,
        { method: "POST" },
      );
      const data = await res.json();

      if (data.status === "completed") {
        setIsConverted(true);
        setIsConverting(false);
        // Reload the page to use converted file
        window.location.reload();
        return;
      }

      // Start polling for progress
      startPolling();
    } catch (err) {
      console.error("Conversion error:", err);
      setIsConverting(false);
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

  const searchTorrentsForEpisode = async (episode: any) => {
    setSearchingEp(episode);
    setIsSearchingTorrents(true);
    setTorrentResults([]);

    try {
      const res = await fetch(
        `/api/downloader/search-episode?title=${encodeURIComponent(animeInfo?.title || "")}&episode=${episode.number}`,
      );
      const data = await res.json();
      setTorrentResults(data.results || []);
    } catch (err) {
      console.error("Torrent search error:", err);
    } finally {
      setIsSearchingTorrents(false);
    }
  };

  const startInstantStream = async (magnet: string, hash: string) => {
    setDownloadingHash(hash);
    try {
      const res = await fetch("/api/downloader/download-magnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          magnet,
          subfolder: decodedFolder,
        }),
      });

      if (res.ok) {
        setSearchingEp(null);
        // Refresh downloading files
        const libRes = await fetch(`/api/library/${folder}`);
        const libData = await libRes.json();
        if (libData.downloadingFiles)
          setDownloadingFiles(libData.downloadingFiles);

        // Find the episode and switch to it in live mode
        const ep = episodes.find((e) => e.number === searchingEp?.number);
        if (ep) {
          // We might not have the localPath yet because it's a new download
          // but qBittorrent usually creates the file quickly.
          // For now, let's just show a notification or rely on the playlist refresh.
          setIsLiveMode(true);
          // Re-fetch everything to get the new episode link
          window.location.reload();
        }
      }
    } catch (err) {
      console.error("Start instant stream error:", err);
    } finally {
      setDownloadingHash(null);
    }
  };

  /**
   * Helper to extract episode number from filename
   * Look for patterns like " - 01", "Ep 01", "E01", " 01 "
   */
  const extractEpisodeNumber = (filename: string): string | null => {
    const cleanName = filename.split("/").pop() || "";
    // Matches common patterns: S01E01, Ep 01, - 01, [01]
    const match =
      cleanName.match(/[Ee](\d+)/) ||
      cleanName.match(/Ep\s*(\d+)/i) ||
      cleanName.match(/\s-\s(\d+)/) ||
      cleanName.match(/\[(\d+)\]/) ||
      cleanName.match(/\b(\d{1,3})\b/);

    return match ? parseInt(match[1], 10).toString() : null;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col">
      {/* Premium Top Navigation ... */}
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
                className={`w-2 h-2 rounded-full ${isLiveMode ? "bg-red-500 animate-pulse" : "bg-blue-500"}`}
              />
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">
                {isLiveMode ? "Live Transcoding Active" : "Sequential Stream"}
              </span>
            </div>
            <h1 className="text-sm font-bold line-clamp-1 max-w-[400px] text-white/90">
              {decodedFolder}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentIsDownloading && (
            <button
              onClick={() => setIsLiveMode(!isLiveMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-medium ${
                isLiveMode
                  ? "bg-red-600/30 border-red-500/50 text-red-400 hover:bg-red-600/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  : "bg-blue-600/20 border-blue-500/50 text-blue-400 hover:bg-blue-600/30"
              }`}
            >
              <MonitorPlay className="w-4 h-4" />
              {isLiveMode ? "Disable Live Mode" : "Enable Live Mode"}
            </button>
          )}
          <button
            onClick={searchSubtitles}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-blue-600/20 rounded-xl border border-white/5 transition-all text-sm font-medium hover:border-blue-500/50"
          >
            <Subtitles className="w-4 h-4" />
            Napisy Online
          </button>
          <div className="w-px h-6 bg-white/10" />
          <div className="px-3 py-1.5 bg-blue-600/10 rounded-lg border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-wider">
            Premium Player
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 overflow-hidden">
        {/* Main Content Area */}
        <div className="lg:col-span-3 p-4 lg:p-8 overflow-y-auto custom-scrollbar">
          {/* Vidstack Video Player */}
          <div className="relative aspect-video rounded-3xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] border border-white/5 bg-black mx-auto">
            {currentFile ? (
              <MediaPlayer
                ref={player}
                title={currentFile}
                src={streamUrl}
                crossOrigin
                playsInline
                className="w-full h-full"
              >
                <MediaProvider>
                  {/* Napisy zewnętrzne (OpenSubtitles) */}
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
                  {/* Napisy wewnętrzne (z pliku MKV) */}
                  {internalSubs.map((sub, idx) => (
                    <Track
                      key={`${currentFile}-${sub.localIndex}`}
                      src={`/api/subtitles/extract/${sub.localIndex}/${folder}/${encodeURIComponent(currentFile)}`}
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
                <MonitorPlay className="w-20 h-20 text-white/10" />
                <p className="text-white/20 font-medium">
                  Wybierz odcinek z listy po prawej
                </p>
              </div>
            )}
          </div>

          {/* Anime Info Section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white/5 rounded-[2rem] p-8 border border-white/10 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Info className="w-32 h-32" />
              </div>

              {loadingInfo ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-8 bg-white/10 rounded-lg w-1/3" />
                  <div className="space-y-2">
                    <div className="h-4 bg-white/5 rounded w-full" />
                    <div className="h-4 bg-white/5 rounded w-full" />
                    <div className="h-4 bg-white/5 rounded w-3/4" />
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

                  <p className="text-white/60 text-sm leading-relaxed line-clamp-4 relative z-10">
                    {animeInfo.synopsis || "Brak opisu dla tej serii."}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-6">
                    {animeInfo.genres.map((genre) => (
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
              <div className="w-full h-px bg-white/5 my-4" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                  Episodes
                </span>
                <span className="text-xl font-black italic text-white/90">
                  {animeInfo?.episodes || "??"}
                </span>
              </div>

              {episodes.length > 0 && currentFile && (
                <button
                  onClick={() => {
                    const currentEp = episodes.find(
                      (e) => e.localPath === currentFile,
                    );
                    if (currentEp) toggleWatched(currentEp._id);
                  }}
                  className={`mt-6 w-full py-3 rounded-xl border flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                    episodes.find((e) => e.localPath === currentFile)?.watched
                      ? "bg-green-500/20 border-green-500/30 text-green-500"
                      : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {episodes.find((e) => e.localPath === currentFile)?.watched
                    ? "Obejrzano"
                    : "Oznacz jako obejrzane"}
                </button>
              )}
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
                <div className="flex justify-between text-sm py-2 border-b border-white/5">
                  <span className="text-white/40">Format:</span>
                  <span className="text-blue-400 font-bold uppercase">
                    {currentFile?.split(".").pop()}
                  </span>
                </div>
                <div className="flex justify-between text-sm py-2">
                  <span className="text-white/40">Ścieżka:</span>
                  <span className="text-white/60 truncate ml-4">
                    {currentFile}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600/10 to-transparent rounded-3xl p-6 border border-blue-500/10">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-500" />
                Informacje o strumieniu
              </h2>
              <div className="space-y-4">
                <p className="text-white/50 text-xs leading-relaxed">
                  Dla najlepszej jakości i obsługi przewijania, pliki MKV
                  powinny zostać skonwertowane do formatu MP4. System może to
                  zrobić automatycznie.
                </p>

                {currentFile?.toLowerCase().endsWith(".mkv") && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Disc
                          className={`w-4 h-4 ${isConverting ? "text-blue-500 animate-spin" : "text-white/40"}`}
                        />
                        <span className="text-xs font-bold text-white/70">
                          Konwersja MKV → MP4
                        </span>
                      </div>
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
                          onClick={startConversion}
                          className="w-full py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Konwertuj teraz
                        </button>
                      )
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-white/5 rounded-md text-[10px] font-bold text-white/40 border border-white/5">
                    AAC Audio
                  </span>
                  <span className="px-2 py-1 bg-white/5 rounded-md text-[10px] font-bold text-white/40 border border-white/5">
                    H.264 Video
                  </span>
                  {currentFile?.toLowerCase().endsWith(".mp4") && (
                    <span className="px-2 py-1 bg-green-500/10 rounded-md text-[10px] font-bold text-green-500 border border-green-500/20">
                      Native Playback
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Episode Playlist Area (Sticky Side) */}
        <div className="bg-[#080808] border-l border-white/5 flex flex-col h-full shadow-[-32px_0_64px_-32px_rgba(0,0,0,0.5)] z-40">
          <div className="p-6 border-b border-white/5 bg-[#0a0a0a]/50">
            <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Playlist
              <span className="ml-auto bg-white/10 px-2 py-0.5 rounded text-[10px] text-white/60">
                {files.length}
              </span>
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar">
            {loading ? (
              [...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-white/5 rounded-2xl animate-pulse"
                />
              ))
            ) : episodes.length > 0 ? (
              episodes.map((ep) => (
                <button
                  key={ep._id}
                  disabled={!ep.isDownloaded}
                  onClick={() => {
                    if (ep.isDownloaded) {
                      setCurrentFile(ep.localPath);
                      setActiveSub(null);
                      const isDownloading = downloadingFiles.some((df) =>
                        df.endsWith(ep.localPath),
                      );
                      setIsLiveMode(isDownloading);
                    }
                  }}
                  className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all text-left relative overflow-hidden ${
                    currentFile === ep.localPath
                      ? "bg-blue-600 border-blue-400 shadow-[0_8px_32px_rgba(37,99,235,0.3)]"
                      : ep.isDownloaded
                        ? "bg-[#0c0c0c] border-white/5 hover:border-white/10 hover:bg-[#121212]"
                        : "bg-[#050505] border-white/5 opacity-50 grayscale cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                      currentFile === ep.localPath
                        ? "bg-white text-blue-600 scale-110 shadow-lg"
                        : "bg-white/5 text-white/40"
                    }`}
                  >
                    {ep.watched ? (
                      <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-500" />
                    ) : (
                      String(ep.number).padStart(2, "0")
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-bold truncate transition-colors ${
                        currentFile === ep.localPath
                          ? "text-white"
                          : "text-white/70 group-hover:text-white"
                      }`}
                    >
                      {ep.number}. {ep.title || "Episode " + ep.number}
                    </p>
                    <p
                      className={`text-[9px] truncate transition-colors font-medium flex items-center gap-2 ${
                        currentFile === ep.localPath
                          ? "text-white/60"
                          : "text-white/30"
                      }`}
                    >
                      {ep.isDownloaded &&
                        downloadingFiles.some((df) =>
                          df.endsWith(ep.localPath),
                        ) && (
                          <span className="flex items-center gap-1.5 px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[8px] font-black text-blue-400 uppercase tracking-tighter animate-pulse">
                            <Loader2 className="w-2 h-2 animate-spin" />
                            Live Streaming
                          </span>
                        )}
                      {!ep.isDownloaded && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            searchTorrentsForEpisode(ep);
                          }}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 rounded text-[8px] font-black text-white uppercase tracking-tighter transition-all"
                        >
                          <Download className="w-2 h-2" />
                          Szukaj i Oglądaj
                        </button>
                      )}
                      {ep.isDownloaded && ep.localPath.split("/").pop()}
                    </p>
                  </div>
                  {currentFile === ep.localPath ? (
                    <Play className="w-4 h-4 text-white fill-white" />
                  ) : !ep.isDownloaded ? (
                    <Download
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        searchTorrentsForEpisode(ep);
                      }}
                      className="w-4 h-4 text-blue-500 cursor-pointer hover:text-blue-400 transition-colors"
                    />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white/20 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  )}
                </button>
              ))
            ) : files.length > 0 ? (
              files.map((file, index) => (
                <button
                  key={file}
                  onClick={() => {
                    setCurrentFile(file);
                    setActiveSub(null); // Resetuj napisy przy zmianie odcinka
                    // Auto-enable live mode for downloading files
                    const isDownloading = downloadingFiles.some((df) =>
                      df.endsWith(file),
                    );
                    setIsLiveMode(isDownloading);
                  }}
                  className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all text-left relative overflow-hidden ${
                    currentFile === file
                      ? "bg-blue-600 border-blue-400 shadow-[0_8px_32px_rgba(37,99,235,0.3)]"
                      : "bg-[#0c0c0c] border-white/5 hover:border-white/10 hover:bg-[#121212]"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                      currentFile === file
                        ? "bg-white text-blue-600 scale-110 shadow-lg"
                        : "bg-white/5 text-white/40"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-bold truncate transition-colors ${
                        currentFile === file
                          ? "text-white"
                          : "text-white/70 group-hover:text-white"
                      }`}
                    >
                      {(() => {
                        const epNum = extractEpisodeNumber(file);
                        const jikanEp = episodesInfo.find(
                          (e) => e.episode === epNum,
                        );
                        return jikanEp
                          ? `${epNum}. ${jikanEp.title}`
                          : file.split("/").pop();
                      })()}
                    </p>
                    <p
                      className={`text-[9px] truncate transition-colors font-medium flex items-center gap-2 ${
                        currentFile === file ? "text-white/60" : "text-white/30"
                      }`}
                    >
                      {downloadingFiles.some((df) => df.endsWith(file)) && (
                        <span className="flex items-center gap-1.5 px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[8px] font-black text-blue-400 uppercase tracking-tighter animate-pulse">
                          <Loader2 className="w-2 h-2 animate-spin" />
                          Live Streaming
                        </span>
                      )}
                      {file.split("/").pop()}
                    </p>
                  </div>
                  {currentFile === file ? (
                    <Play className="w-4 h-4 text-white fill-white" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white/20 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  )}
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <MonitorPlay className="w-12 h-12 text-white/10 mb-4" />
                <p className="text-sm text-white/30 italic">
                  Brak wspieranych plików wideo w tym folderze.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subtitles Search Modal */}
      {showSubModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setShowSubModal(false)}
          />
          <div className="relative w-full max-w-2xl bg-[#0f0f0f] border border-white/10 rounded-[2.5rem] shadow-[0_64px_128px_-32px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-8 border-b border-white/5 bg-[#121212]/50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black flex items-center gap-3">
                  <Search className="w-6 h-6 text-blue-500" />
                  Wyszukaj Napisy
                </h3>
                <p className="text-xs text-white/40 mt-1">
                  Wyniki z bazy OpenSubtitles.com
                </p>
              </div>
              <button
                onClick={() => setShowSubModal(false)}
                className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5 opacity-40 rotate-180" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {isSearchingSubs ? (
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
                    onClick={() => selectSubtitle(sub)}
                    className="w-full flex items-center gap-4 p-4 bg-[#151515] hover:bg-[#1a1a1a] rounded-2xl border border-white/5 transition-all group text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                      <Subtitles className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white/90 truncate">
                        {sub.attributes.release ||
                          sub.attributes.feature_details.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-white/40 font-bold uppercase tracking-wider">
                        <span className="px-1.5 py-0.5 bg-blue-600/20 text-blue-400 rounded ring-1 ring-blue-500/20">
                          {sub.attributes.language}
                        </span>
                        <span>{sub.attributes.fps} FPS</span>
                        <span>ID: {sub.id}</span>
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
                  <p className="text-[10px] mt-2 max-w-xs uppercase font-bold tracking-widest leading-loose">
                    Upewnij się, że dodałeś OPENSUBTITLES_API_KEY do .env.local
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Torrent Search Modal */}
      {searchingEp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-white">
          <div
            className="absolute inset-0 bg-[#050505]/80 backdrop-blur-xl"
            onClick={() => setSearchingEp(null)}
          />
          <div className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black italic uppercase tracking-tighter">
                  Szukaj Torrenta
                </h2>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">
                  {anime?.title} — Odcinek {searchingEp.number}
                </p>
              </div>
              <button
                onClick={() => setSearchingEp(null)}
                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all"
              >
                <div className="w-4 h-4 text-white/40">✕</div>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {isSearchingTorrents ? (
                <div className="py-20 flex flex-col items-center gap-6">
                  <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 animate-pulse">
                    Przeszukiwanie Nyaa.si...
                  </p>
                </div>
              ) : torrentResults.length > 0 ? (
                <div className="space-y-3">
                  {torrentResults.map((t: any) => (
                    <div
                      key={t.id}
                      className="group p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-2xl transition-all flex items-center justify-between gap-6"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                          {t.title}
                        </h4>
                        <div className="mt-2 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/20">
                          <span className="text-blue-500/60">{t.size}</span>
                          <span>{t.seeders} SEEDS</span>
                          <span
                            className={
                              t.isHEVC
                                ? "text-purple-500/60"
                                : "text-green-500/60"
                            }
                          >
                            {t.codec}
                          </span>
                        </div>
                      </div>
                      <button
                        disabled={downloadingHash === t.hash}
                        onClick={() => startInstantStream(t.magnet, t.hash)}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          downloadingHash === t.hash
                            ? "bg-white/5 text-white/20 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                        }`}
                      >
                        {downloadingHash === t.hash
                          ? "Startowanie..."
                          : "Oglądaj Live"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-xs text-white/20 font-bold uppercase tracking-widest italic">
                    Nie znaleziono odpowiednich torrentów
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
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
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .vds-video-layout {
          --video-brand: #2563eb;
        }

        .vds-player {
          background-color: black !important;
        }

        /* Captions styling for subtitles */
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

function LayoutGrid({ className }: { className?: string }) {
  return (
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
      className={className}
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
