import { NextRequest, NextResponse } from "next/server";
import {
  getConversionProgress,
  hasConvertedVersion,
  cancelConversion,
} from "@/lib/conversionService";
import { addConversionJob, conversionQueue } from "@/lib/queueService";

/**
 * POST /api/convert/[...path] - Start conversion of MKV to MP4
 * GET /api/convert/[...path] - Check conversion status
 * DELETE /api/convert/[...path] - Cancel ongoing conversion
 */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathSegments } = await params;
  const filePath = pathSegments.join("/");

  if (!filePath.toLowerCase().endsWith(".mkv")) {
    return NextResponse.json(
      { error: "Only MKV files can be converted" },
      { status: 400 },
    );
  }

  // Check if already converted
  if (await hasConvertedVersion(filePath)) {
    return NextResponse.json({
      status: "completed",
      message: "File already converted",
    });
  }

  // Add job to BullMQ
  try {
    const job = await addConversionJob(filePath);
    return NextResponse.json({
      status: "started",
      jobId: job.id,
      message: "Conversion scheduled in BullMQ",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathSegments } = await params;
  const filePath = pathSegments.join("/");

  // Check if already converted
  if (await hasConvertedVersion(filePath)) {
    return NextResponse.json({
      status: "completed",
      progress: 100,
    });
  }

  // Check in-memory progress
  const progress = getConversionProgress(filePath);
  if (progress !== null) {
    return NextResponse.json({
      status: "in_progress",
      progress,
    });
  }

  // Check BullMQ progress
  const jobId = `convert-${filePath.replace(/\//g, "-")}`;
  const job = await conversionQueue.getJob(jobId);
  if (job) {
    const state = await job.getState();
    return NextResponse.json({
      status: state === "active" ? "in_progress" : "queued",
      progress: job.progress || 0,
    });
  }

  return NextResponse.json({
    status: "not_started",
    progress: 0,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathSegments } = await params;
  const filePath = pathSegments.join("/");

  // Cancel in-memory if active
  const cancelled = cancelConversion(filePath);

  // Try to remove from BullMQ
  const jobId = `convert-${filePath.replace(/\//g, "-")}`;
  const job = await conversionQueue.getJob(jobId);
  if (job) {
    await job.remove();
  }

  return NextResponse.json({
    cancelled: cancelled || !!job,
    message: (cancelled || job) ? "Conversion cancelled" : "No active conversion found",
  });
}

