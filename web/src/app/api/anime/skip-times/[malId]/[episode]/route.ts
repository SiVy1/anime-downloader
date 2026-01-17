import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy for AniSkip API to fetch skip times (Opening/Ending)
 * https://api.aniskip.com/v2/skip-times/:malId/:episode?types[]=op&types[]=ed&episodeLength=0
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
    const clientId =
      process.env.ANISKIP_CLIENT_ID || "ZGfO0sMF3eCwLYf8yMSCJjlynwNGRXWE";

    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        "X-Client-ID": clientId,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ found: false, results: [] });
      }
      throw new Error(`AniSkip API responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[AniSkip Proxy] Error:", err.message);
    return NextResponse.json(
      { error: "Failed to fetch skip times" },
      { status: 500 },
    );
  }
}
