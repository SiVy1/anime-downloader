import { NextRequest, NextResponse } from "next/server";
import { animeSubtitleService } from "@/lib/animeSubtitleService";

/**
 * GET /api/subtitles/anime/search
 *
 * Search for anime subtitles using the Smart Resolver algorithm.
 * Uses AniDB/Anime Tosho ecosystem for accurate, synchronized results.
 *
 * Query params:
 *   - filename: The anime filename to search subtitles for
 *
 * Returns:
 *   - SubtitleResult object with download URL on success
 *   - null if no matching subtitles found
 *   - Error object on failure
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("filename");

  if (!filename) {
    return NextResponse.json(
      { error: "Missing 'filename' query parameter" },
      { status: 400 },
    );
  }

  try {
    const result = await animeSubtitleService.findSubtitles(filename);

    if (!result) {
      return NextResponse.json({
        subtitle: null,
        message: "No matching subtitles found for this file",
      });
    }

    return NextResponse.json({
      subtitle: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API] Anime subtitle search error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
