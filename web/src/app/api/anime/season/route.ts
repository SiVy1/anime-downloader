import { NextRequest, NextResponse } from "next/server";
import { getSeasonalAnime } from "@/lib/anilistService";

/**
 * GET /api/anime/season
 * Returns currently airing anime from AniList GraphQL API
 *
 * Query params:
 * - year: number (optional, defaults to current year)
 * - season: "WINTER" | "SPRING" | "SUMMER" | "FALL" (optional, defaults to current)
 * - filter: "TV" | "MOVIE" | "OVA" etc (optional, defaults to TV)
 * - page: number (optional, defaults to 1)
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const year = url.searchParams.get("year");
  const season = url.searchParams.get("season");
  const filter = url.searchParams.get("filter") || "TV";
  const page = url.searchParams.get("page") || "1";

  try {
    const result = await getSeasonalAnime(
      year ? parseInt(year, 10) : undefined,
      season || undefined,
      filter,
      parseInt(page, 10),
    );

    // Transform AniList format to match existing frontend expectations
    const anime = result.anime.map((a) => ({
      id: a.id,
      title: a.title.english || a.title.romaji,
      titleEnglish: a.title.english,
      titleRomaji: a.title.romaji,
      titleNative: a.title.native,
      images: {
        jpg: {
          image_url: a.coverImage.large,
          large_image_url: a.coverImage.extraLarge,
        },
        webp: {
          image_url: a.coverImage.large,
          large_image_url: a.coverImage.extraLarge,
        },
      },
      synopsis:
        a.description?.slice(0, 300) +
        (a.description && a.description.length > 300 ? "..." : ""),
      score: a.averageScore ? a.averageScore / 10 : null,
      episodes: a.episodes,
      status: a.status,
      type: a.format,
      airing: a.status === "RELEASING",
      genres: a.genres || [],
      studios: a.studios?.nodes?.map((s) => s.name) || [],
      nextAiringEpisode: a.nextAiringEpisode,
    }));

    return NextResponse.json({
      anime,
      pagination: {
        current_page: result.pagination.currentPage,
        last_visible_page: result.pagination.lastPage,
        has_next_page: result.pagination.hasNextPage,
        items: {
          count: anime.length,
          total: result.pagination.total,
        },
      },
      season: result.season,
    });
  } catch (error: any) {
    console.error("[Season API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch season data" },
      { status: 500 },
    );
  }
}
