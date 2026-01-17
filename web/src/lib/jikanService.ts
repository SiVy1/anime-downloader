import { getRedis, connectDB } from "./db";
import { Anime, Episode, IAnime, IEpisode } from "@/models/Anime";

/**
 * JikanService - Single Source of Truth for Anime Data
 *
 * Implements Write-Through Cache Pattern:
 * 1. Check MongoDB first (persistent storage)
 * 2. If missing, fetch from Jikan API
 * 3. Upsert to MongoDB (persistence)
 * 4. Cache in Redis (fast access)
 * 5. Return data
 */

export interface JikanAnime {
  mal_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    };
    webp?: {
      image_url: string;
      large_image_url: string;
    };
  };
  synopsis: string;
  score: number;
  type: string;
  genres: Array<{ mal_id: number; name: string }>;
  episodes: number | null;
  status: string;
}

export interface JikanEpisode {
  mal_id: number;
  title: string;
  episode: string;
  aired?: string;
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
 * Convert Jikan API response to MongoDB document format (IAnime)
 */
function jikanToAnimeDoc(jikanData: JikanAnime): Partial<IAnime> {
  return {
    malId: jikanData.mal_id,
    title: jikanData.title,
    images: {
      webp: {
        image_url:
          jikanData.images.webp?.image_url || jikanData.images.jpg.image_url,
        large_image_url:
          jikanData.images.webp?.large_image_url ||
          jikanData.images.jpg.large_image_url,
      },
    },
    synopsis: jikanData.synopsis || "",
    type: jikanData.type || "TV",
    episodesCount: jikanData.episodes || 0,
    status: jikanData.status || "Unknown",
    genres: jikanData.genres?.map((g) => g.name) || [],
    score: jikanData.score || 0,
    updatedAt: new Date(),
  };
}

/**
 * Search anime and return a list of matches (for global search)
 * Uses Redis cache only (search results are transient)
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
    const results: JikanAnime[] = data.data.map((anime: JikanAnime) => ({
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
    console.error(`[JikanService] Search error:`, err);
    return [];
  }
}

/**
 * Search anime and return the first best match
 * Uses Redis cache only (search results are transient)
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
    const result: JikanAnime = {
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
 * Get anime by MAL ID - Write-Through Cache Pattern
 *
 * 1. Check MongoDB first
 * 2. If missing, fetch from Jikan API
 * 3. Upsert to MongoDB
 * 4. Cache in Redis
 * 5. Return data
 */
export async function getAnimeById(id: number): Promise<IAnime | null> {
  const redis = getRedis();
  const cacheKey = `jikan:anime:${id}`;

  try {
    // Step 1: Check Redis cache first (fastest)
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      // If cached data has _id, it's from our DB, return as-is
      if (parsed._id || parsed.malId) {
        return parsed as IAnime;
      }
    }

    // Step 2: Check MongoDB (persistent storage)
    await connectDB();
    const dbAnime = await Anime.findOne({ malId: id });
    if (dbAnime) {
      // Cache the DB result in Redis for future fast access
      await redis.set(cacheKey, JSON.stringify(dbAnime), "EX", 86400);
      return dbAnime;
    }

    // Step 3: Fetch from Jikan API (external source)
    await throttle();
    const response = await fetch(`${JIKAN_BASE_URL}/anime/${id}`);
    if (!response.ok) return null;

    const data = await response.json();
    const jikanData: JikanAnime = data.data;

    // Step 4: Upsert to MongoDB (Write-Through)
    const animeDoc = jikanToAnimeDoc(jikanData);
    const savedAnime = await Anime.findOneAndUpdate(
      { malId: id },
      { $set: animeDoc },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // Step 5: Cache in Redis
    await redis.set(cacheKey, JSON.stringify(savedAnime), "EX", 86400);

    console.log(`[JikanService] Synced anime ID ${id} to MongoDB`);
    return savedAnime;
  } catch (error) {
    console.error(`[JikanService] Error fetching anime ID ${id}:`, error);
    return null;
  }
}

/**
 * Get episodes for an anime - Write-Through Cache Pattern
 *
 * 1. Check MongoDB first
 * 2. If missing/empty, fetch from Jikan API
 * 3. Upsert episodes to MongoDB
 * 4. Cache in Redis
 * 5. Return data
 */
export async function getAnimeEpisodes(
  malId: number,
  animeId?: string,
): Promise<IEpisode[]> {
  const redis = getRedis();
  const cacheKey = `jikan:episodes:${malId}`;

  try {
    await connectDB();

    // Step 1: If we have animeId, check MongoDB first
    if (animeId) {
      const dbEpisodes = await Episode.find({ animeId }).sort({ number: 1 });
      if (dbEpisodes.length > 0) {
        await redis.set(cacheKey, JSON.stringify(dbEpisodes), "EX", 86400);
        return dbEpisodes;
      }
    } else {
      // Try to find anime by malId to get animeId
      const anime = await Anime.findOne({ malId });
      if (anime) {
        const dbEpisodes = await Episode.find({ animeId: anime._id }).sort({
          number: 1,
        });
        if (dbEpisodes.length > 0) {
          await redis.set(cacheKey, JSON.stringify(dbEpisodes), "EX", 86400);
          return dbEpisodes;
        }
        // Set animeId for later use
        animeId = anime._id.toString();
      }
    }

    // Step 2: Check Redis cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as IEpisode[];
      }
    }

    // Step 3: Fetch from Jikan API
    await throttle();
    const response = await fetch(`${JIKAN_BASE_URL}/anime/${malId}/episodes`);
    if (!response.ok) return [];

    const data = await response.json();
    const jikanEpisodes: JikanEpisode[] = data.data || [];

    if (jikanEpisodes.length === 0) return [];

    // Step 4: If we have animeId, upsert episodes to MongoDB
    if (animeId) {
      const episodeDocs = jikanEpisodes.map((ep) => ({
        animeId,
        number: parseInt(ep.episode || String(ep.mal_id), 10),
        title: ep.title || `Episode ${ep.episode || ep.mal_id}`,
        airedDate: ep.aired,
        isDownloaded: false,
        watched: false,
      }));

      // Bulk upsert episodes
      const bulkOps = episodeDocs.map((doc) => ({
        updateOne: {
          filter: { animeId: doc.animeId, number: doc.number },
          update: { $setOnInsert: doc },
          upsert: true,
        },
      }));

      await Episode.bulkWrite(bulkOps, { ordered: false });

      // Fetch the saved episodes
      const savedEpisodes = await Episode.find({ animeId }).sort({ number: 1 });
      await redis.set(cacheKey, JSON.stringify(savedEpisodes), "EX", 86400);
      console.log(
        `[JikanService] Synced ${savedEpisodes.length} episodes for malId ${malId}`,
      );
      return savedEpisodes;
    }

    // Step 5: If no animeId, just cache raw data and return
    await redis.set(cacheKey, JSON.stringify(jikanEpisodes), "EX", 86400);
    return jikanEpisodes as unknown as IEpisode[];
  } catch (error) {
    console.error(
      `[JikanService] Error fetching episodes for ID ${malId}:`,
      error,
    );
    return [];
  }
}

/**
 * Ensure anime exists in database (for library operations)
 * This is the main entry point for "Add to Library" functionality
 *
 * Returns the anime document with episodes synced
 */
export async function ensureAnimeInLibrary(
  malId: number,
): Promise<{ anime: IAnime | null; episodes: IEpisode[] }> {
  // getAnimeById now handles the Write-Through pattern
  const anime = await getAnimeById(malId);
  if (!anime) {
    return { anime: null, episodes: [] };
  }

  // Get episodes (will sync if needed)
  const episodes = await getAnimeEpisodes(malId, anime._id.toString());

  return { anime, episodes };
}
