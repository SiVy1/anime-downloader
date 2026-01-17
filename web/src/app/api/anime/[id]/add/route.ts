import { NextRequest, NextResponse } from "next/server";
import { ensureAnimeInLibrary } from "@/lib/jikanService";

/**
 * POST /api/anime/[id]/add
 *
 * Add anime to library - thin controller.
 * The jikanService.ensureAnimeInLibrary() handles:
 * - Checking if anime exists in DB
 * - Fetching from Jikan API if missing
 * - Upserting to MongoDB (Write-Through)
 * - Syncing episodes
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const malId = parseInt(id, 10);

  if (isNaN(malId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    // Service handles all data fetching and persistence
    const { anime, episodes } = await ensureAnimeInLibrary(malId);

    if (!anime) {
      return NextResponse.json(
        { error: "Anime not found on MAL" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Added to library",
      anime,
      episodeCount: episodes.length,
    });
  } catch (error) {
    console.error("[Add to Library API] Error:", error);
    return NextResponse.json(
      { error: "Failed to add anime to library" },
      { status: 500 },
    );
  }
}
