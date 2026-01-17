import { getRedis } from "./db";

/**
 * JikanService - Lightweight wrapper for Jikan v4 API
 */

export interface JikanAnime {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    };
  };
  synopsis: string;
  score: number;
  type: string;
  genres: Array<{ name: string }>;
  episodes: number | null;
  status: string;
}

export interface JikanEpisode {
  mal_id: number;
  title: string;
  episode: string;
}

const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

// Simple rate-limiting queue
let lastRequestTime = 0;
const MIN_DELAY = 400; // ~2.5 requests per second (Jikan allows 3/sec)

async function throttle() {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < MIN_DELAY) {
    const wait = MIN_DELAY - timeSinceLast;
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastRequestTime = Date.now();
}

/**
 * Clean folder names to improve Jikan search accuracy
 * Removes tags, resolutions, years, and file extensions
 */
export function cleanAnimeName(name: string): string {
  if (!name) return "";

  let clean = name;

  // 1. Remove bracketed tags like [SubsPlease], [1080p], [HEVC]
  clean = clean.replace(/\[([^\]]+)\]/g, "");

  // 2. Remove parenthesized years like (2024)
  clean = clean.replace(/\(\d{4}\)/g, "");

  // 3. Remove common resolution patterns
  clean = clean.replace(/\d{3,4}p/gi, "");

  // 4. Remove common web-DL/Rip tags
  clean = clean.replace(/(WEBRip|WEB-DL|BD|BluRay|x264|x265|HEVC)/gi, "");

  // 5. Replace dots, underscores, and dashes with spaces
  clean = clean.replace(/[._\-]/g, " ");

  // 6. Remove file extensions if present
  clean = clean.replace(/\.(mkv|mp4|avi|mov|ts)$/i, "");

  // 7. Trim and collapse multiple spaces
  clean = clean.trim().replace(/\s+/g, " ");

  return clean;
}

/**
 * Search anime and return a list of matches (for global search)
 */
export async function searchAnimeFull(query: string): Promise<JikanAnime[]> {
  const redis = getRedis();
  const cacheKey = `jikan:search:full:${query.toLowerCase()}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    await throttle();
    const response = await fetch(
      `${JIKAN_BASE_URL}/anime?q=${encodeURIComponent(query)}&limit=10`,
    );
    if (!response.ok) return [];

    const data = await response.json();
    const results = data.data.map((anime: any) => ({
      mal_id: anime.mal_id,
      title: anime.title,
      images: anime.images,
      synopsis: anime.synopsis,
      score: anime.score,
      type: anime.type,
      genres: anime.genres || [],
      episodes: anime.episodes,
      status: anime.status,
    }));

    await redis.set(cacheKey, JSON.stringify(results), "EX", 86400); // 24h
    return results;
  } catch (err) {
    console.error(`[Jikan] Search error:`, err);
    return [];
  }
}

/**
 * Search anime and return the first best match
 */
export async function searchAnime(query: string): Promise<JikanAnime | null> {
  const cleanedQuery = cleanAnimeName(query);
  if (!cleanedQuery) return null;

  const redis = getRedis();
  const cacheKey = `jikan:search:best:${cleanedQuery.toLowerCase()}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    await throttle();
    const response = await fetch(
      `${JIKAN_BASE_URL}/anime?q=${encodeURIComponent(cleanedQuery)}&limit=1`,
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.data || data.data.length === 0) return null;

    const anime = data.data[0];
    const result = {
      mal_id: anime.mal_id,
      title: anime.title,
      images: anime.images,
      synopsis: anime.synopsis,
      score: anime.score,
      type: anime.type,
      genres: anime.genres || [],
      episodes: anime.episodes,
      status: anime.status,
    };

    await redis.set(cacheKey, JSON.stringify(result), "EX", 86400);
    return result;
  } catch (error) {
    console.error(
      `[JikanService] Error searching anime "${cleanedQuery}":`,
      error,
    );
    return null;
  }
}

/**
 * Get full anime details by MAL ID
 */
export async function getAnimeById(id: number): Promise<JikanAnime | null> {
  const redis = getRedis();
  const cacheKey = `jikan:anime:${id}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    await throttle();
    const response = await fetch(`${JIKAN_BASE_URL}/anime/${id}`);
    if (!response.ok) return null;

    const data = await response.json();
    const result = data.data;

    await redis.set(cacheKey, JSON.stringify(result), "EX", 86400);
    return result;
  } catch (error) {
    console.error(`[JikanService] Error fetching anime ID ${id}:`, error);
    return null;
  }
}

/**
 * Get episode list for an anime
 */
export async function getAnimeEpisodes(id: number): Promise<JikanEpisode[]> {
  const redis = getRedis();
  const cacheKey = `jikan:episodes:${id}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    await throttle();
    const response = await fetch(`${JIKAN_BASE_URL}/anime/${id}/episodes`);
    if (!response.ok) return [];

    const data = await response.json();
    const result = data.data || [];

    await redis.set(cacheKey, JSON.stringify(result), "EX", 86400);
    return result;
  } catch (error) {
    console.error(
      `[JikanService] Error fetching episodes for ID ${id}:`,
      error,
    );
    return [];
  }
}
