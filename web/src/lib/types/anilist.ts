/**
 * AniList GraphQL API Types
 * Based on AniList GraphQL schema: https://anilist.github.io/ApiV2-GraphQL-Docs/
 */

export interface AniListTitle {
  romaji: string;
  english: string | null;
  native: string | null;
}

export interface AniListCoverImage {
  large: string;
  extraLarge: string;
  medium: string;
}

export interface AniListFuzzyDate {
  year: number | null;
  month: number | null;
  day: number | null;
}

export interface AniListStudio {
  id: number;
  name: string;
  isAnimationStudio: boolean;
}

export interface AniListGenre {
  name: string;
}

export interface AniListStreamingEpisode {
  title: string | null;
  thumbnail: string | null;
  url: string | null;
  site: string | null;
}

export interface AniListAiringSchedule {
  id: number;
  episode: number;
  airingAt: number;
  timeUntilAiring: number;
}

export interface AniListMedia {
  id: number;
  idMal: number | null;
  title: AniListTitle;
  coverImage: AniListCoverImage;
  bannerImage: string | null;
  description: string | null;
  format: string | null;
  status: string | null;
  episodes: number | null;
  duration: number | null;
  genres: string[];
  averageScore: number | null;
  meanScore: number | null;
  popularity: number | null;
  season: string | null;
  seasonYear: number | null;
  startDate: AniListFuzzyDate | null;
  endDate: AniListFuzzyDate | null;
  studios: {
    nodes: AniListStudio[];
  } | null;
  streamingEpisodes: AniListStreamingEpisode[];
  nextAiringEpisode: AniListAiringSchedule | null;
  isAdult: boolean;
  siteUrl: string;
}

export interface AniListPageInfo {
  total: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
  perPage: number;
}

export interface AniListSearchResponse {
  Page: {
    pageInfo: AniListPageInfo;
    media: AniListMedia[];
  };
}

export interface AniListMediaResponse {
  Media: AniListMedia;
}

export interface AniListSeasonResponse {
  Page: {
    pageInfo: AniListPageInfo;
    media: AniListMedia[];
  };
}

export interface AniListViewer {
  id: number;
  name: string;
  avatar: {
    large: string;
  };
}
