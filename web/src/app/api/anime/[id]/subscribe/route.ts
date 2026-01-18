import { NextRequest, NextResponse } from "next/server";
import { toggleSubscription, setSubscription } from "@/lib/pvrService";

/**
 * POST /api/anime/[id]/subscribe
 *
 * Toggle or set subscription status for an anime.
 * Without body: toggles subscription
 * With body { subscribed: boolean }: sets explicitly
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const anilistId = parseInt(id, 10);

  if (isNaN(anilistId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    let anime;

    // Check if body has explicit subscription value
    const body = await req.json().catch(() => null);

    if (body && typeof body.subscribed === "boolean") {
      anime = await setSubscription(anilistId, body.subscribed);
    } else {
      anime = await toggleSubscription(anilistId);
    }

    if (!anime) {
      return NextResponse.json(
        { error: "Anime not found in library" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      anilistId: anime.anilistId,
      title: anime.title,
      isSubscribed: anime.isSubscribed,
    });
  } catch (error) {
    console.error("[Subscribe API] Error:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 },
    );
  }
}
