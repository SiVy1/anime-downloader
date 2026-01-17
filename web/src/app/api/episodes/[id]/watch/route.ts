import { NextRequest, NextResponse } from "next/server";
import { toggleEpisodeWatched } from "@/lib/episodeService";

/**
 * POST /api/episodes/[id]/watch
 *
 * Toggle or set episode watched status.
 * Thin controller - delegates to EpisodeService.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: episodeId } = await params;

  // Parse optional body for explicit watched value
  let watchedState: boolean | undefined;
  try {
    const text = await req.text();
    if (text) {
      const body = JSON.parse(text);
      watchedState = body.watched;
    }
  } catch {
    // Empty body is fine - will use toggle mode
  }

  try {
    // Service handles all business logic
    const result = await toggleEpisodeWatched(episodeId, watchedState);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      watched: result.watched,
    });
  } catch (error) {
    console.error("[Watch Toggle API] Error:", error);
    return NextResponse.json(
      { error: "Failed to update watch status" },
      { status: 500 },
    );
  }
}
