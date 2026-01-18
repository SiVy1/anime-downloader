import { getRedis, connectDB } from "./db";
import { Anime, Episode, IAnime, IEpisode } from "@/models/Anime";
import {
  AniListMedia,
  AniListSearchResponse,
  AniListMediaResponse,
  AniListSeasonResponse,
} from "./types/anilist";

/**
 * AniListService - Single Source of Truth for Anime Data
 *
 * Implements Write-Through Cache Pattern:
 * 1. Check MongoDB first (persistent storage)
 * 2. If missing, fetch from AniList GraphQL API
 * 3. Upsert to MongoDB (persistence)
 * 4. Cache in Redis (fast access)
 * 5. Return data
 */

const ANILIST_API_URL = "https://graphql.anilist.co";

// Rate limiting: AniList allows 90 req/min
let lastRequestTime = 0;
const MIN_DELAY = 700; // ~1.4 requests per second (safe margin)

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
 * Execute a GraphQL query against AniList API
 */
async function graphqlRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T | null> {
  await throttle();

  try {
    const response = await fetch(ANILIST_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      console.error(`[AniListService] HTTP error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.errors) {
      console.error("[AniListService] GraphQL errors:", data.errors);
      return null;
    }

    return data.data as T;
  } catch (error) {
    console.error("[AniListService] Request error:", error);
    return null;
  }
}

// GraphQL Fragments for reusable field selections
const MEDIA_FRAGMENT = `
  fragment MediaFields on Media {
    id
    idMal
    title {
      romaji
      english
      native
    }
    coverImage {
      large
      extraLarge
      medium
    }
    bannerImage
    description(asHtml: false)
    format
    status
    episodes
    duration
    genres
    averageScore
    meanScore
    popularity
    season
    seasonYear
    startDate {
      year
      month
      day
    }
    endDate {
      year
      month
      day
    }
    studios(isMain: true) {
      nodes {
        id
        name
        isAnimationStudio
      }
    }
    streamingEpisodes {
      title
      thumbnail
      url
      site
    }
    nextAiringEpisode {
      id
      episode
      airingAt
      timeUntilAiring
    }
    isAdult
    siteUrl
  }
`;

// GraphQL Queries
const SEARCH_ANIME_QUERY = `
  ${MEDIA_FRAGMENT}
  query SearchAnime($search: String!, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
        perPage
      }
      media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
        ...MediaFields
      }
    }
  }
`;

const GET_ANIME_BY_ID_QUERY = `
  ${MEDIA_FRAGMENT}
  query GetAnimeById($id: Int!) {
    Media(id: $id, type: ANIME) {
      ...MediaFields
    }
  }
`;

const GET_SEASONAL_ANIME_QUERY = `
  ${MEDIA_FRAGMENT}
  query GetSeasonalAnime($season: MediaSeason, $seasonYear: Int, $page: Int, $perPage: Int, $format: MediaFormat) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
        perPage
      }
      media(season: $season, seasonYear: $seasonYear, type: ANIME, format: $format, sort: POPULARITY_DESC) {
        ...MediaFields
      }
    }
  }
`;

const GET_AIRING_NOW_QUERY = `
  ${MEDIA_FRAGMENT}
  query GetAiringNow($page: Int, $perPage: Int, $format: MediaFormat) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
        perPage
      }
      media(status: RELEASING, type: ANIME, format: $format, sort: POPULARITY_DESC) {
        ...MediaFields
      }
    }
  }
`;

/**
 * Clean folder names to improve search accuracy
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
 * Convert AniList API response to MongoDB document format (IAnime)
 */
function anilistToAnimeDoc(media: AniListMedia): Partial<IAnime> {
  return {
    anilistId: media.id,
    title: media.title.english || media.title.romaji,
    images: {
      webp: {
        image_url: media.coverImage.large,
        large_image_url: media.coverImage.extraLarge,
      },
    },
    synopsis: media.description?.replace(/<[^>]*>/g, "") || "",
    type: media.format || "TV",
    episodesCount: media.episodes || 0,
    status: media.status || "Unknown",
    genres: media.genres || [],
    score: media.averageScore ? media.averageScore / 10 : 0,
    updatedAt: new Date(),
  };
}

/**
 * Search anime and return a list of matches (for global search)
 * Uses Redis cache only (search results are transient)
 */
export async function searchAnimeFull(
  query: string,
  limit: number = 10,
): Promise<AniListMedia[]> {
  const redis = getRedis();
  const cacheKey = `anilist:search:full:${query.toLowerCase()}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const data = await graphqlRequest<AniListSearchResponse>(
      SEARCH_ANIME_QUERY,
      {
        search: query,
        page: 1,
        perPage: limit,
      },
    );

    if (!data?.Page?.media) return [];

    const results = data.Page.media;
    await redis.set(cacheKey, JSON.stringify(results), "EX", 86400); // 24h
    return results;
  } catch (err) {
    console.error(`[AniListService] Search error:`, err);
    return [];
  }
}

/**
 * Search anime and return the first best match
 * Uses Redis cache only (search results are transient)
 */
export async function searchAnime(query: string): Promise<AniListMedia | null> {
  const cleanedQuery = cleanAnimeName(query);
  if (!cleanedQuery) return null;

  const redis = getRedis();
  const cacheKey = `anilist:search:best:${cleanedQuery.toLowerCase()}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const data = await graphqlRequest<AniListSearchResponse>(
      SEARCH_ANIME_QUERY,
      {
        search: cleanedQuery,
        page: 1,
        perPage: 1,
      },
    );

    if (!data?.Page?.media?.[0]) return null;

    const result = data.Page.media[0];
    await redis.set(cacheKey, JSON.stringify(result), "EX", 86400);
    return result;
  } catch (error) {
    console.error(
      `[AniListService] Error searching anime "${cleanedQuery}":`,
      error,
    );
    return null;
  }
}

/**
 * Get anime by AniList ID - Write-Through Cache Pattern
 *
 * 1. Check MongoDB first
 * 2. If missing, fetch from AniList GraphQL API
 * 3. Upsert to MongoDB
 * 4. Cache in Redis
 * 5. Return data
 */
export async function getAnimeById(id: number): Promise<IAnime | null> {
  const redis = getRedis();
  const cacheKey = `anilist:anime:${id}`;

  try {
    // Step 1: Check Redis cache first (fastest)
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed._id || parsed.anilistId) {
        return parsed as IAnime;
      }
    }

    // Step 2: Check MongoDB (persistent storage)
    await connectDB();
    const dbAnime = await Anime.findOne({ anilistId: id });
    if (dbAnime) {
      // Cache the DB result in Redis for future fast access
      await redis.set(cacheKey, JSON.stringify(dbAnime), "EX", 86400);
      return dbAnime;
    }

    // Step 3: Fetch from AniList GraphQL API (external source)
    const data = await graphqlRequest<AniListMediaResponse>(
      GET_ANIME_BY_ID_QUERY,
      { id },
    );

    if (!data?.Media) return null;

    // Step 4: Upsert to MongoDB (Write-Through)
    const animeDoc = anilistToAnimeDoc(data.Media);
    const savedAnime = await Anime.findOneAndUpdate(
      { anilistId: id },
      { $set: animeDoc },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // Step 5: Cache in Redis
    await redis.set(cacheKey, JSON.stringify(savedAnime), "EX", 86400);

    console.log(`[AniListService] Synced anime ID ${id} to MongoDB`);
    return savedAnime;
  } catch (error) {
    console.error(`[AniListService] Error fetching anime ID ${id}:`, error);
    return null;
  }
}

/**
 * Get episodes for an anime - Write-Through Cache Pattern
 *
 * Note: AniList doesn't have a dedicated episodes endpoint like MAL/Jikan.
 * We use streamingEpisodes for metadata when available, and generate
 * episode entries based on the anime's episode count.
 */
export async function getAnimeEpisodes(
  anilistId: number,
  animeId?: string,
): Promise<IEpisode[]> {
  const redis = getRedis();
  const cacheKey = `anilist:episodes:${anilistId}`;

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
      // Try to find anime by anilistId to get animeId
      const anime = await Anime.findOne({ anilistId });
      if (anime) {
        const dbEpisodes = await Episode.find({ animeId: anime._id }).sort({
          number: 1,
        });
        if (dbEpisodes.length > 0) {
          await redis.set(cacheKey, JSON.stringify(dbEpisodes), "EX", 86400);
          return dbEpisodes;
        }
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

    // Step 3: Fetch anime data from AniList to get episode info
    const data = await graphqlRequest<AniListMediaResponse>(
      GET_ANIME_BY_ID_QUERY,
      { id: anilistId },
    );

    if (!data?.Media) return [];

    const media = data.Media;
    const episodeCount = media.episodes || 0;

    if (episodeCount === 0 && !media.streamingEpisodes?.length) return [];

    // Step 4: If we have animeId, create episode entries
    if (animeId && episodeCount > 0) {
      const episodeDocs = [];

      // Use streaming episodes if available for titles/thumbnails
      const streamingMap = new Map(
        media.streamingEpisodes?.map((ep) => {
          // Extract episode number from title if possible
          const match = ep.title?.match(/Episode\s*(\d+)/i);
          const epNum = match ? parseInt(match[1], 10) : null;
          return [epNum, ep];
        }) || [],
      );

      for (let i = 1; i <= episodeCount; i++) {
        const streamingEp = streamingMap.get(i);
        episodeDocs.push({
          animeId,
          number: i,
          title: streamingEp?.title || `Episode ${i}`,
          airedDate: undefined,
          isDownloaded: false,
          watched: false,
        });
      }

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
        `[AniListService] Synced ${savedEpisodes.length} episodes for anilistId ${anilistId}`,
      );
      return savedEpisodes;
    }

    return [];
  } catch (error) {
    console.error(
      `[AniListService] Error fetching episodes for ID ${anilistId}:`,
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
  anilistId: number,
): Promise<{ anime: IAnime | null; episodes: IEpisode[] }> {
  const anime = await getAnimeById(anilistId);
  if (!anime) {
    return { anime: null, episodes: [] };
  }

  const episodes = await getAnimeEpisodes(anilistId, anime._id.toString());

  return { anime, episodes };
}

/**
 * Get seasonal anime
 *
 * @param year - Year of the season (defaults to current year)
 * @param season - Season name (defaults to current season)
 * @param filter - Media format filter (defaults to TV)
 * @param page - Page number for pagination
 */
export async function getSeasonalAnime(
  year?: number,
  season?: string,
  filter: string = "TV",
  page: number = 1,
): Promise<{
  anime: AniListMedia[];
  pagination: {
    currentPage: number;
    lastPage: number;
    hasNextPage: boolean;
    total: number;
  };
  season: { year: number; season: string };
}> {
  const redis = getRedis();

  // Determine current season if not provided
  const now = new Date();
  const currentYear = year || now.getFullYear();
  const currentSeason = season || getCurrentSeason();

  const cacheKey = `anilist:season:${currentYear}:${currentSeason}:${filter}:${page}`;

  try {
    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // Use different query based on whether we have specific season or want currently airing
    let data: AniListSeasonResponse | null;

    if (year && season) {
      data = await graphqlRequest<AniListSeasonResponse>(
        GET_SEASONAL_ANIME_QUERY,
        {
          season: season.toUpperCase(),
          seasonYear: year,
          page,
          perPage: 24,
          format: filter.toUpperCase(),
        },
      );
    } else {
      // Get currently airing anime
      data = await graphqlRequest<AniListSeasonResponse>(GET_AIRING_NOW_QUERY, {
        page,
        perPage: 24,
        format: filter.toUpperCase(),
      });
    }

    if (!data?.Page) {
      return {
        anime: [],
        pagination: {
          currentPage: page,
          lastPage: 1,
          hasNextPage: false,
          total: 0,
        },
        season: { year: currentYear, season: currentSeason },
      };
    }

    const result = {
      anime: data.Page.media,
      pagination: {
        currentPage: data.Page.pageInfo.currentPage,
        lastPage: data.Page.pageInfo.lastPage,
        hasNextPage: data.Page.pageInfo.hasNextPage,
        total: data.Page.pageInfo.total,
      },
      season: { year: currentYear, season: currentSeason },
    };

    await redis.set(cacheKey, JSON.stringify(result), "EX", 3600); // 1 hour
    return result;
  } catch (error) {
    console.error("[AniListService] Error fetching seasonal anime:", error);
    return {
      anime: [],
      pagination: {
        currentPage: page,
        lastPage: 1,
        hasNextPage: false,
        total: 0,
      },
      season: { year: currentYear, season: currentSeason },
    };
  }
}

function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 1 && month <= 3) return "WINTER";
  if (month >= 4 && month <= 6) return "SPRING";
  if (month >= 7 && month <= 9) return "SUMMER";
  return "FALL";
}
