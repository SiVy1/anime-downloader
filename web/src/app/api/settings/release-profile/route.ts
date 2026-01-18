import { NextRequest, NextResponse } from "next/server";
import {
  getGlobalDefaultProfile,
  updateGlobalDefaultProfile,
} from "@/lib/releaseProfileService";

/**
 * GET /api/settings/release-profile
 *
 * Get the global default release profile
 */
export async function GET(req: NextRequest) {
  try {
    const profile = await getGlobalDefaultProfile();
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[Settings API] GET Error:", error);
    return NextResponse.json(
      { error: "Failed to get global profile" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/settings/release-profile
 *
 * Update the global default release profile
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const profile = await updateGlobalDefaultProfile({
      preferredGroups: body.preferredGroups,
      preferredQuality: body.preferredQuality,
      excludeGroups: body.excludeGroups,
      autoDownload: body.autoDownload,
    });

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("[Settings API] PUT Error:", error);
    return NextResponse.json(
      { error: "Failed to update global profile" },
      { status: 500 },
    );
  }
}
