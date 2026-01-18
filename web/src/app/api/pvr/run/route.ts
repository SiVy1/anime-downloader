import { NextRequest, NextResponse } from "next/server";
import { runPVRCycle, getPVRStatus } from "@/lib/pvrService";

/**
 * POST /api/pvr/run
 *
 * Trigger a PVR cycle - check all subscribed anime for new episodes.
 * This endpoint is designed to be called by a Linux cron job.
 *
 * Example cron entry (runs every 30 minutes):
 * 0,30 * * * * curl -X POST http://localhost:3000/api/pvr/run
 */
export async function POST(req: NextRequest) {
  console.log("[PVR API] Manual trigger received");

  try {
    const results = await runPVRCycle();

    const summary = {
      totalChecked: results.length,
      totalEpisodesFound: results.reduce((s, r) => s + r.episodesFound, 0),
      totalDownloaded: results.reduce((s, r) => s + r.episodesDownloaded, 0),
      errors: results.filter((r) => r.errors.length > 0).length,
    };

    return NextResponse.json({
      success: true,
      summary,
      results,
    });
  } catch (error: any) {
    console.error("[PVR API] Cycle error:", error);
    return NextResponse.json(
      { error: "PVR cycle failed", details: error.message },
      { status: 500 },
    );
  }
}

/**
 * GET /api/pvr/run
 *
 * Get PVR status without triggering a cycle
 */
export async function GET(req: NextRequest) {
  try {
    const status = await getPVRStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    console.error("[PVR API] Status error:", error);
    return NextResponse.json(
      { error: "Failed to get PVR status" },
      { status: 500 },
    );
  }
}
