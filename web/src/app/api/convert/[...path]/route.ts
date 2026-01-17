import { NextRequest, NextResponse } from "next/server";
import {
  convertMkvToMp4,
  getConversionProgress,
  hasConvertedVersion,
  cancelConversion,
} from "@/lib/conversionService";

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
  if (hasConvertedVersion(filePath)) {
    return NextResponse.json({
      status: "completed",
      message: "File already converted",
    });
  }

  // Check if conversion in progress
  const progress = getConversionProgress(filePath);
  if (progress !== null) {
    return NextResponse.json({
      status: "in_progress",
      progress,
    });
  }

  // Start conversion (non-blocking)
  console.log(`[API] Starting conversion for: ${filePath}`);

  // Run conversion in background
  convertMkvToMp4(filePath)
    .then((result) => {
      if (result.success) {
        console.log(`[API] Conversion completed: ${filePath}`);
      } else {
        console.error(`[API] Conversion failed: ${result.error}`);
      }
    })
    .catch((err) => {
      console.error(`[API] Conversion error: ${err.message}`);
    });

  return NextResponse.json({
    status: "started",
    message: "Conversion started in background",
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathSegments } = await params;
  const filePath = pathSegments.join("/");

  // Check if already converted
  if (hasConvertedVersion(filePath)) {
    return NextResponse.json({
      status: "completed",
      progress: 100,
    });
  }

  // Check progress
  const progress = getConversionProgress(filePath);
  if (progress !== null) {
    return NextResponse.json({
      status: "in_progress",
      progress,
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

  const cancelled = cancelConversion(filePath);

  return NextResponse.json({
    cancelled,
    message: cancelled ? "Conversion cancelled" : "No active conversion found",
  });
}
