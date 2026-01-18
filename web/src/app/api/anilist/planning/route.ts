import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPlanningList, getCurrentlyWatching } from "@/lib/anilistMutations";

/**
 * GET /api/anilist/planning
 * Returns user's "Planning to Watch" list from AniList
 *
 * Query params:
 * - type: "planning" | "current" (default: "planning")
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken || !session?.user?.anilistId) {
    return NextResponse.json(
      { error: "Unauthorized - Please log in with AniList" },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "planning";

  try {
    let entries;

    if (type === "current") {
      entries = await getCurrentlyWatching(
        session.accessToken,
        session.user.anilistId,
      );
    } else {
      entries = await getPlanningList(
        session.accessToken,
        session.user.anilistId,
      );
    }

    return NextResponse.json({ entries });
  } catch (error: any) {
    console.error("[AniList Planning API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
