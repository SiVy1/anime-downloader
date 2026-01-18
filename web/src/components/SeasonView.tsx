"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSeasonAnime, SeasonAnime } from "@/hooks/useSeasonAnime";
import { SeasonFilters } from "./season/SeasonFilters";
import { AnimeGrid } from "./season/AnimeGrid";

interface SeasonViewProps {
  trackedIds: Set<number>;
  onTrack: (anime: SeasonAnime) => void;
}

export default function SeasonView({ trackedIds, onTrack }: SeasonViewProps) {
  const { anime, loading, error, searchQuery, setSearchQuery } =
    useSeasonAnime();

  const handleTrack = (anime: SeasonAnime) => {
    onTrack(anime);
    toast.success(
      `Dodano ${anime.title_english || anime.title} do biblioteki`,
      {
        description: "Anime będzie teraz śledzone pod kątem nowych odcinków.",
      },
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-white/30">
            Ładowanie sezonu...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <SeasonFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        resultsCount={anime.length}
      />

      {anime.length > 0 ? (
        <AnimeGrid
          anime={anime}
          trackedIds={trackedIds}
          onTrack={handleTrack}
        />
      ) : (
        <div className="py-20 text-center">
          <p className="text-sm text-white/20 font-bold uppercase tracking-widest italic">
            Nie znaleziono anime pasujących do wyszukiwania
          </p>
        </div>
      )}
    </div>
  );
}
