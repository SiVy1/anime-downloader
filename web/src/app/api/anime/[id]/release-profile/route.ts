import { NextRequest, NextResponse } from "next/server";
import {
  getReleaseProfile,
  updateReleaseProfile,
} from "@/lib/releaseProfileService";

/**
 * GET /api/anime/[id]/release-profile
 *
 * Get release profile for an anime (falls back to global default)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const anilistId = parseInt(id, 10);

  if (isNaN(anilistId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const profile = await getReleaseProfile(anilistId);
    return NextResponse.json({ anilistId, profile });
  } catch (error) {
    console.error("[ReleaseProfile API] GET Error:", error);
    return NextResponse.json(
      { error: "Failed to get release profile" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/anime/[id]/release-profile
 *
 * Update release profile for an anime
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const anilistId = parseInt(id, 10);

  if (isNaN(anilistId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const body = await req.json();

    const anime = await updateReleaseProfile(anilistId, {
      preferredGroups: body.preferredGroups,
      preferredQuality: body.preferredQuality,
      excludeGroups: body.excludeGroups,
      autoDownload: body.autoDownload,
    });

    if (!anime) {
      return NextResponse.json(
        { error: "Anime not found in library" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      anilistId: anime.anilistId,
      profile: anime.releaseProfile,
    });
  } catch (error) {
    console.error("[ReleaseProfile API] PUT Error:", error);
    return NextResponse.json(
      { error: "Failed to update release profile" },
      { status: 500 },
    );
  }
}
