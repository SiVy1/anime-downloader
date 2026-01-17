"use client";

import { useState, useEffect, use } from "react";
import {
  ArrowLeft,
  Star,
  Play,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Info,
  LayoutGrid,
  List,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function AnimeDetailPage() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();

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

  const fetchAnimeData = async () => {
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
  };

  useEffect(() => {
    if (id) fetchAnimeData();
  }, [id]);

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
        fetchAnimeData(); // Refresh to see downloaded status
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLinking(false);
    }
  };

  const startSearchTorrent = async (episode: any) => {
    setSearchingEp(episode);
    setTorrentResults([]);
    setIsSearchingTorrents(true);
    try {
      const res = await fetch(
        `/api/downloader/search-episode?title=${encodeURIComponent(data.anime.title)}&episode=${episode.number}`,
      );
      const d = await res.json();
      setTorrentResults(d.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingTorrents(false);
    }
  };

  const startDownload = async (magnet: string, hash: string) => {
    setDownloadingHash(hash);
    try {
      // Create subfolder for anime
      const folderName = data.anime.localFolderName || data.anime.title;
      await fetch("/api/downloader/download-magnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          magnet: [magnet],
          subfolder: folderName,
        }),
      });

      // Auto-link if not linked
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

  if (error || !data) {
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

  const { anime, episodes } = data;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">
      {/* Hero Header */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        {/* Background Blur Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={anime.images.webp.large_image_url}
            className="w-full h-full object-cover scale-110 blur-3xl opacity-20"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex flex-col justify-end pb-12">
          <button
            onClick={() => router.back()}
            className="absolute top-8 left-6 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="grid md:grid-cols-[280px_1fr] gap-10 items-end">
            {/* Poster */}
            <div className="hidden md:block aspect-[3/4] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
              <img
                src={anime.images.webp.large_image_url}
                className="w-full h-full object-cover"
                alt={anime.title}
              />
            </div>

            {/* Info */}
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-black text-yellow-500">
                    {anime.score || "N/A"}
                  </span>
                </div>
                <div className="px-3 py-1 bg-blue-600/10 border border-blue-600/20 rounded-full">
                  <span className="text-xs font-black text-blue-500 uppercase tracking-widest">
                    {anime.type}
                  </span>
                </div>
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                  <span className="text-xs font-black text-white/40 uppercase tracking-widest">
                    {anime.status}
                  </span>
                </div>
              </div>

              <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-[0.9] mb-6 drop-shadow-2xl">
                {anime.title}
              </h1>

              <div className="flex flex-wrap gap-2 mb-8">
                {anime.genres.map((g: string) => (
                  <span
                    key={g}
                    className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-3 py-1.5 bg-white/5 rounded-lg"
                  >
                    {g}
                  </span>
                ))}
              </div>

              <p className="text-sm md:text-base text-white/60 leading-relaxed max-w-2xl line-clamp-3 mb-8">
                {anime.synopsis}
              </p>

              <div className="flex items-center gap-4">
                {/* Action Buttons */}
                <button className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-600/20 group">
                  <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
                  Zacznij oglądać
                </button>
                <button
                  onClick={() => openLinkModal()}
                  className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all border border-white/5"
                >
                  Dodaj do biblioteki
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Episodes Section */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-4">
              <div className="w-10 h-1.5 bg-blue-600 rounded-full" />
              Lista Odcinków
            </h2>
            <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] mt-3">
              Łącznie {anime.episodesCount || episodes.length} odcinków
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
              <button className="p-2 bg-blue-600 rounded-lg shadow-lg">
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-white/5 rounded-lg transition-all">
                <List className="w-4 h-4 text-white/40" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {episodes.map((ep: any) => (
            <div
              key={ep._id}
              className="group relative bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden hover:border-blue-500/30 transition-all duration-500 shadow-xl"
            >
              {/* Overlay for not downloaded */}
              {!ep.isDownloaded && (
                <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                  <button
                    onClick={() => startSearchTorrent(ep)}
                    className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <span className="text-[8px] font-black uppercase tracking-widest">
                    Szukaj Torrenta
                  </span>
                </div>
              )}

              <div className="aspect-video relative bg-white/5">
                {/* Episode Number Badge */}
                <div className="absolute top-3 left-3 z-20 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-[10px] font-black">
                  EP {ep.number}
                </div>

                {/* Download Status */}
                <div
                  className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border ${ep.isDownloaded ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-white/5 border-white/10 text-white/20"}`}
                >
                  {ep.isDownloaded ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
              </div>

              <div className="p-5">
                <h3 className="text-sm font-bold uppercase tracking-tight line-clamp-1 mb-2 group-hover:text-blue-400 transition-colors">
                  {ep.title || `Odcinek ${ep.number}`}
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-white/30">
                    <Clock className="w-3 h-3" />
                    {ep.airedDate || "N/A"}
                  </div>
                  {ep.isDownloaded && (
                    <div className="w-1 h-1 rounded-full bg-white/10" />
                  )}
                  {ep.isDownloaded && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-green-500/60">
                      Gotowy
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

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
                  {anime.title} — Odcinek {searchingEp.number}
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
                        onClick={() => startDownload(t.magnet, t.hash)}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          downloadingHash === t.hash
                            ? "bg-white/5 text-white/20 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                        }`}
                      >
                        {downloadingHash === t.hash
                          ? "Startowanie..."
                          : "Pobierz"}
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

      {/* Link Folder Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-white">
          <div
            className="absolute inset-0 bg-[#050505]/80 backdrop-blur-xl"
            onClick={() => setShowLinkModal(false)}
          />
          <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-8 border-b border-white/5">
              <h2 className="text-xl font-black italic uppercase tracking-tighter">
                Powiąż z folderem
              </h2>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">
                Wybierz lokalny folder zawierający odcinki
              </p>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                {availableFolders.map((folder) => (
                  <button
                    key={folder}
                    disabled={isLinking}
                    onClick={() => linkFolder(folder)}
                    className="w-full p-4 bg-white/[0.02] hover:bg-blue-600/10 border border-white/5 hover:border-blue-500/30 rounded-2xl transition-all text-left group"
                  >
                    <p className="text-xs font-bold uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                      {folder}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {isLinking && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-50">
                <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  Skanowanie plików...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
