import { useState, useEffect, useCallback } from "react";

export interface SeasonAnime {
  mal_id: number;
  title: string;
  title_english?: string;
  images: any;
  synopsis?: string;
  score?: number;
  episodes?: number;
  type?: string;
  genres: string[];
  studios: string[];
  broadcast?: string;
  airing?: boolean;
}

export function useSeasonAnime() {
  const [anime, setAnime] = useState<SeasonAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for filtering (placeholders as requested)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [selectedSeason, setSelectedSeason] = useState<string>("");

  const fetchSeason = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Currently using the default "now airing" endpoint
      const res = await fetch("/api/anime/season?filter=tv");
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setAnime(data.anime || []);
      }
    } catch (err) {
      setError("Failed to load season data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeason();
  }, [fetchSeason]);

  // Derived filtered data
  const filteredAnime = anime.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.title_english?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return {
    anime: filteredAnime,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    selectedYear,
    setSelectedYear,
    selectedSeason,
    setSelectedSeason,
    refresh: fetchSeason,
  };
}
