import { NextRequest, NextResponse } from "next/server";
import { searchNyaa } from "@/lib/downloader";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");
  const episode = searchParams.get("episode");
  const quality = searchParams.get("quality") || "1080p";

  if (!title || !episode) {
    return NextResponse.json(
      { error: "Missing title or episode" },
      { status: 400 },
    );
  }

  try {
    // Build an optimized query
    // Example: "Solo Leveling 01 1080p"
    // Using padding for episode number (01 instead of 1) usually works better
    const paddedEp = episode.padStart(2, "0");
    const query = `${title} ${paddedEp} ${quality}`;

    console.log(`[Episode Search] Searching for: ${query}`);

    // Use existing Nyaa search (which already has sorting and filtering)
    const results = await searchNyaa(query, "seeders", "desc");

    return NextResponse.json({ results: results || [] });
  } catch (err: any) {
    console.error(
      `[Episode Search] Error searching for ${title} ${episode}:`,
      err,
    );
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
