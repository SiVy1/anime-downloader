import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/db";

const JIKAN_BASE_URL = "https://api.jikan.moe/v4";
const CACHE_TTL = 3600; // 1 hour cache for season data

/**
 * GET /api/anime/season
 * Returns currently airing anime from Jikan API
 *
 * Query params:
 * - year: number (optional, defaults to current year)
 * - season: "winter" | "spring" | "summer" | "fall" (optional, defaults to current)
 * - filter: "tv" | "movie" | "ova" etc (optional)
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const year = url.searchParams.get("year");
  const season = url.searchParams.get("season");
  const filter = url.searchParams.get("filter") || "tv";
  const page = url.searchParams.get("page") || "1";

  try {
    const redis = await getRedis();
    const cacheKey = `season:${year || "now"}:${season || "now"}:${filter}:${page}`;

    // Check cache first
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json(JSON.parse(cached));
      }
    }

    // Build Jikan URL
    let jikanUrl: string;
    if (year && season) {
      jikanUrl = `${JIKAN_BASE_URL}/seasons/${year}/${season}?filter=${filter}&page=${page}`;
    } else {
      jikanUrl = `${JIKAN_BASE_URL}/seasons/now?filter=${filter}&page=${page}`;
    }

    // Fetch from Jikan
    const response = await fetch(jikanUrl, {
      next: { revalidate: 3600 }, // Next.js cache
    });

    if (!response.ok) {
      throw new Error(`Jikan API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform to simplified format
    const anime =
      data.data?.map((a: any) => ({
        mal_id: a.mal_id,
        title: a.title,
        title_english: a.title_english,
        title_japanese: a.title_japanese,
        images: a.images,
        synopsis:
          a.synopsis?.slice(0, 300) + (a.synopsis?.length > 300 ? "..." : ""),
        score: a.score,
        episodes: a.episodes,
        status: a.status,
        type: a.type,
        source: a.source,
        airing: a.airing,
        aired: a.aired,
        genres: a.genres?.map((g: any) => g.name) || [],
        studios: a.studios?.map((s: any) => s.name) || [],
        broadcast: a.broadcast?.string || null,
      })) || [];

    const result = {
      anime,
      pagination: data.pagination,
      season: {
        year: data.pagination?.last_visible_page
          ? year
          : new Date().getFullYear(),
        season: season || getCurrentSeason(),
      },
    };

    // Cache result
    if (redis) {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Season API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch season data" },
      { status: 500 },
    );
  }
}

function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 1 && month <= 3) return "winter";
  if (month >= 4 && month <= 6) return "spring";
  if (month >= 7 && month <= 9) return "summer";
  return "fall";
}
