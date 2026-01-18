import { NextRequest, NextResponse } from "next/server";
import { getPVRStatus } from "@/lib/pvrService";
import { addPVRJob } from "@/lib/queueService";
import { initPVRWorker } from "@/lib/workers/pvrWorker";

/**
 * POST /api/pvr/run
 *
 * Trigger a PVR cycle - check all subscribed anime for new episodes.
 * Now uses BullMQ to queue the job asynchronously.
 */
export async function POST(req: NextRequest) {
  console.log("[PVR API] Manual trigger received");

  try {
    // Ensure worker is running
    initPVRWorker();

    // Add job to queue
    const job = await addPVRJob();

    return NextResponse.json({
      success: true,
      message: "PVR cycle job has been queued",
      jobId: job.id,
    });
  } catch (error: any) {
    console.error("[PVR API] Queueing error:", error);
    return NextResponse.json(
      { error: "Failed to queue PVR cycle", details: error.message },
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
