import { NextRequest, NextResponse } from "next/server";
import { getAnimeById, getAnimeEpisodes } from "@/lib/anilistService";

/**
 * GET /api/anime/[id]
 *
 * Thin controller - delegates all business logic to anilistService.
 * The service handles: DB lookup -> AniList GraphQL fetch -> MongoDB upsert -> Redis cache
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: anilistIdStr } = await params;
  const anilistId = parseInt(anilistIdStr, 10);

  if (isNaN(anilistId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    // Service handles all data fetching and persistence (Write-Through cache)
    const anime = await getAnimeById(anilistId);

    if (!anime) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 });
    }

    // Get episodes (service handles sync if needed)
    const episodes = await getAnimeEpisodes(anilistId, anime._id.toString());

    return NextResponse.json({ anime, episodes });
  } catch (error) {
    console.error(`[Anime API] Error for ID ${anilistId}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch anime data" },
      { status: 500 },
    );
  }
}
