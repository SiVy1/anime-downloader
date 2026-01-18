"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Library,
  HardDrive,
  Activity,
  ArrowLeft,
  Clock,
  Play,
  Film,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/StatCard";

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats/summary")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard stats:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
            Inicjalizacja Dashboardu...
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const maxActivity = Math.max(...data.activity.map((a: any) => a.count), 5);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Top Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/40 backdrop-blur-xl border-b border-white/5 py-4 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div className="flex flex-col">
              <h1 className="text-xl font-black italic uppercase tracking-tighter">
                System Insights
              </h1>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.2em]">
                Centrum Monitorowania
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-16">
        {/* Stat Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Twoja Biblioteka"
            value={data.library.totalAnime}
            icon={Library}
            description="Łączna liczba serii"
            color="blue"
          />
          <StatCard
            title="Lokalne Odcinki"
            value={data.library.totalEpisodes}
            icon={Film}
            description="Pobrane pliki wideo"
            color="purple"
          />
          <StatCard
            title="Postęp Oglądania"
            value={`${data.library.percentWatched}%`}
            icon={CheckCircle2}
            description={`${data.library.watchedEpisodes} z ${data.library.totalEpisodes} obejrzanych`}
            color="green"
          />
          <StatCard
            title="Wolne Miejsce"
            value={formatBytes(data.disk.free).split(' ')[0]}
            icon={HardDrive}
            description={`${formatBytes(data.disk.free).split(' ')[1]} Dostępne`}
            color="yellow"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Activity / Downloads Section */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black italic uppercase tracking-[0.3em] flex items-center gap-4 text-blue-500">
                <div className="w-8 h-px bg-blue-600" />
                Aktywność Pobierania
              </h2>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/20">
                Ostatnie 7 dni
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 h-80 flex items-end justify-between gap-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(37,99,235,0.05)_0%,_transparent_70%)] pointer-events-none" />
              
              {data.activity.map((day: any, i: number) => {
                const height = (day.count / maxActivity) * 100;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-4 group/bar h-full justify-end">
                    <div className="relative w-full flex-1 flex flex-col justify-end items-center px-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 5)}%` }}
                        transition={{ delay: i * 0.1, type: "spring", damping: 20 }}
                        className={`w-full max-w-[40px] rounded-t-xl transition-all duration-300 relative ${
                          day.count > 0 ? "bg-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.3)]" : "bg-white/5"
                        } group-hover/bar:bg-blue-400`}
                      >
                         {day.count > 0 && (
                           <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-md pointer-events-none">
                             {day.count}
                           </div>
                         )}
                      </motion.div>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/20 group-hover/bar:text-white/60 transition-colors">
                      {new Date(day.date).toLocaleDateString('pl-PL', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Disk Info Section */}
          <div className="space-y-8">
            <h2 className="text-sm font-black italic uppercase tracking-[0.3em] flex items-center gap-4 text-white/40">
              <div className="w-8 h-px bg-white/20" />
              Miejsca na dysku
            </h2>

            <div className="bg-[#0a0a0a] rounded-[3rem] p-10 border border-white/5 space-y-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                <HardDrive size={120} />
              </div>

              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                      Zajętość partycji
                    </p>
                    <p className="text-3xl font-black italic tracking-tighter text-white">
                      {data.disk.percent}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                      Użyto: {formatBytes(data.disk.used)}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                      Z: {formatBytes(data.disk.total)}
                    </p>
                  </div>
                </div>

                <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${data.disk.percent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4 relative z-10">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                    Oszacowano na
                  </p>
                  <p className="text-sm font-black italic text-white/80">
                    ~{(data.disk.free / (1.5 * 1024 * 1024 * 1024)).toFixed(0)} Odc.
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                    Status HD
                  </p>
                  <p className={`text-sm font-black italic ${data.disk.percent > 90 ? 'text-red-500' : 'text-green-500'}`}>
                    {data.disk.percent > 90 ? 'Krytyczny' : 'Dobry'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Added Section */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black italic uppercase tracking-[0.3em] flex items-center gap-4 text-purple-500">
              <div className="w-8 h-px bg-purple-600" />
              Ostatnio Aktualizowane
            </h2>
            <Link 
              href="/" 
              className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-blue-500 transition-colors"
            >
              Zobacz pełną bibliotekę &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {data.latestAnime?.map((anime: any, i: number) => (
              <motion.div
                key={anime.anilistId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="group relative"
              >
                <Link href={`/watch/${encodeURIComponent(anime.localFolderName || anime.title)}`}>
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 border border-white/10 group-hover:border-purple-500/50 transition-all duration-300">
                    <img 
                      src={anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      alt={anime.title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-[10px] font-black uppercase tracking-tight line-clamp-2">
                        {anime.title}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Settings Section */}

        <div className="space-y-8">
          <h2 className="text-sm font-black italic uppercase tracking-[0.3em] flex items-center gap-4 text-orange-550">
            <div className="w-8 h-px bg-orange-600" />
            Konfiguracja Systemu
          </h2>

          <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="text-lg font-black italic uppercase tracking-tighter">Powiadomienia Discord</h3>
              <p className="text-xs text-white/40 leading-relaxed font-medium">
                Wklej tutaj adres Discord Webhook, aby otrzymywać powiadomienia o nowych odcinkach 
                oraz postępach w pobieraniu bezpośrednio na swój serwer.
              </p>
              
              <div className="space-y-3 pt-4">
                <input
                  type="text"
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-xs font-medium"
                  id="discord-url"
                  defaultValue={data.settings?.discord_webhook_url || ""}
                />
                <button
                  onClick={async () => {
                    const url = (document.getElementById("discord-url") as HTMLInputElement).value;
                    const res = await fetch("/api/settings", {
                      method: "POST",
                      body: JSON.stringify({ key: "discord_webhook_url", value: url }),
                      headers: { "Content-Type": "application/json" },
                    });
                    if (res.ok) {
                      alert("Ustawienia zapisane!");
                    }
                  }}
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:border-blue-500/50"
                >
                  Zapisz Zmiany
                </button>
              </div>
            </div>

            <div className="bg-blue-600/5 border border-blue-500/10 rounded-[2rem] p-8 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 opacity-60">Szybka Pomoc</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0 text-blue-400 font-black text-xs">1</div>
                  <p className="text-[11px] text-white/60 leading-relaxed">
                    Stwórz webhooka w ustawieniach kanału na Discordzie i wklej link obok.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0 text-blue-400 font-black text-xs">2</div>
                  <p className="text-[11px] text-white/60 leading-relaxed">
                    Skonfiguruj qBittorrent, aby wysyłał sygnał do backendu po zakończeniu pobierania.
                  </p>
                </div>
                <Link 
                  href="https://github.com" 
                  className="inline-block text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors pt-2"
                >
                  Pełna Dokumentacja &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>


      {/* Footer Ambient */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-600/5 to-transparent pointer-events-none" />
    </div>
  );
}
