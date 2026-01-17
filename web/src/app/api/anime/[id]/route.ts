import { NextRequest, NextResponse } from "next/server";
import { getAnimeById, getAnimeEpisodes } from "@/lib/jikanService";

/**
 * GET /api/anime/[id]
 *
 * Thin controller - delegates all business logic to jikanService.
 * The service handles: DB lookup -> Jikan API fetch -> MongoDB upsert -> Redis cache
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: malIdStr } = await params;
  const malId = parseInt(malIdStr, 10);

  if (isNaN(malId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    // Service handles all data fetching and persistence (Write-Through cache)
    const anime = await getAnimeById(malId);

    if (!anime) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 });
    }

    // Get episodes (service handles sync if needed)
    const episodes = await getAnimeEpisodes(malId, anime._id.toString());

    return NextResponse.json({ anime, episodes });
  } catch (error) {
    console.error(`[Anime API] Error for ID ${malId}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch anime data" },
      { status: 500 },
    );
  }
}
