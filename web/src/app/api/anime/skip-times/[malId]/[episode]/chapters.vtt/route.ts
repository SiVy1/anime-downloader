import { NextRequest, NextResponse } from "next/server";
import env from "@/lib/env";

/**
 * Proxy for AniSkip API to fetch skip times and convert them to WebVTT Chapters
 * Returns a text/vtt file for the video player timeline.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ malId: string; episode: string }> },
) {
  const { malId, episode } = await params;
  const { searchParams } = new URL(req.url);
  const episodeLength = searchParams.get("episodeLength") || "0";

  const apiUrl = `https://api.aniskip.com/v2/skip-times/${malId}/${episode}?types[]=op&types[]=ed&types[]=recap&types[]=mixed-op&types[]=mixed-ed&episodeLength=${episodeLength}`;

  try {
    const clientId = env.aniskip.clientId;

    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        "X-Client-ID": clientId,
      },
    });

    if (!response.ok) {
      // If no skip times, return an empty VTT
      return new NextResponse("WEBVTT\n", {
        headers: { "Content-Type": "text/vtt" },
      });
    }

    const data = await response.json();

    // Generate WebVTT content
    let vtt = "WEBVTT\n\n";

    if (data.found && data.results) {
      data.results.forEach((result: any, index: number) => {
        const start = formatVttTime(result.interval.startTime);
        const end = formatVttTime(result.interval.endTime);

        let label = "Skip Segment";
        if (result.skipType === "op") label = "Opening";
        if (result.skipType === "ed") label = "Ending";
        if (result.skipType === "recap") label = "Recap";
        if (result.skipType === "mixed-op") label = "Opening (Mixed)";
        if (result.skipType === "mixed-ed") label = "Ending (Mixed)";

        vtt += `${index + 1}\n`;
        vtt += `${start} --> ${end}\n`;
        vtt += `${label}\n\n`;
      });
    }

    return new NextResponse(vtt, {
      headers: {
        "Content-Type": "text/vtt",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("[AniSkip VTT Proxy] Error:", err.message);
    return new NextResponse("WEBVTT\n", {
      headers: { "Content-Type": "text/vtt" },
    });
  }
}

/**
 * Format seconds into HH:MM:SS.mmm format for WebVTT
 */
function formatVttTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms
    .toString()
    .padStart(3, "0")}`;
}
