import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateProgress, markCompleted } from "@/lib/anilistMutations";

/**
 * POST /api/anilist/progress
 * Update user's watch progress on AniList
 *
 * Body:
 * - mediaId: number (AniList media ID)
 * - progress: number (episode number)
 * - totalEpisodes?: number (if provided and progress >= totalEpisodes, marks as completed)
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Unauthorized - Please log in with AniList" },
      { status: 401 },
    );
  }

  try {
    const body = await req.json();
    const { mediaId, progress, totalEpisodes } = body;

    if (!mediaId || typeof progress !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: mediaId, progress" },
        { status: 400 },
      );
    }

    let success: boolean;

    // If we have totalEpisodes and progress matches it, mark as completed
    if (totalEpisodes && progress >= totalEpisodes) {
      success = await markCompleted(
        session.accessToken,
        mediaId,
        totalEpisodes,
      );
    } else {
      success = await updateProgress(session.accessToken, mediaId, progress);
    }

    if (success) {
      return NextResponse.json({ success: true, mediaId, progress });
    } else {
      return NextResponse.json(
        { error: "Failed to update progress on AniList" },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("[AniList Progress API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
