"use client";

import { useState, useEffect } from "react";
import { Play, ArrowLeft, Disc, ChevronRight, MonitorPlay } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function WatchPage() {
  const { folder } = useParams();
  const decodedFolder = decodeURIComponent(folder as string);

  const [files, setFiles] = useState<string[]>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/library/${folder}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.files) {
          setFiles(data.files);
          if (data.files.length > 0) setCurrentFile(data.files[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [folder]);

  const streamUrl = currentFile
    ? `/api/stream/${folder}/${encodeURIComponent(currentFile)}`
    : "";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Top Navigation */}
      <div className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <Link
          href="/"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex flex-col">
          <span className="text-xs text-white/40 font-medium uppercase tracking-widest">
            Oglądasz teraz
          </span>
          <h1 className="text-lg font-bold line-clamp-1">{decodedFolder}</h1>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-4 min-h-[calc(100vh-73px)]">
        {/* Main Player Area */}
        <div className="lg:col-span-3 p-6 lg:p-10 flex flex-col gap-6">
          <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/5 relative group">
            {currentFile ? (
              <video
                key={streamUrl}
                src={streamUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <MonitorPlay className="w-16 h-16 text-white/10" />
              </div>
            )}
          </div>

          <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-blue-400">
              <Disc className="w-5 h-5 animate-spin-slow" />
              {currentFile || "Wybierz odcinek"}
            </h2>
            <p className="text-white/40 text-sm">
              Streamowane bezpośrednio z Twojego serwera. Obsługa napisów i
              ścieżek dźwiękowych zależy od przeglądarki.
            </p>
          </div>
        </div>

        {/* Episode Playlist Area */}
        <div className="bg-[#0f0f0f]/50 border-l border-white/5 p-6 h-full overflow-y-auto max-h-[calc(100vh-73px)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-blue-500" />
              Lista odcinków
            </h3>
            <span className="text-xs bg-white/5 px-2 py-1 rounded text-white/40">
              {files.length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-white/5 rounded-xl animate-pulse"
                />
              ))
            ) : files.length > 0 ? (
              files.map((file, index) => (
                <button
                  key={file}
                  onClick={() => setCurrentFile(file)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    currentFile === file
                      ? "bg-blue-600/10 border-blue-500/50"
                      : "bg-white/5 border-transparent hover:bg-white/10"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      currentFile === file
                        ? "bg-blue-600 text-white"
                        : "bg-white/10 text-white/40"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        currentFile === file ? "text-blue-400" : "text-white/80"
                      }`}
                    >
                      Odcinek {index + 1}
                    </p>
                    <p className="text-[10px] text-white/40 truncate">{file}</p>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      currentFile === file
                        ? "translate-x-0"
                        : "-translate-x-2 opacity-0"
                    }`}
                  />
                </button>
              ))
            ) : (
              <p className="text-sm text-white/20 text-center py-10 italic">
                Brak wspieranych plików wideo w tym folderze.
              </p>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
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
