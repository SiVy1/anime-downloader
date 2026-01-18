import { NextRequest, NextResponse } from "next/server";
import { downloaderService } from "@/lib/downloader";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const romaji = searchParams.get("romaji");
  const episode = searchParams.get("episode");

  if (!romaji || !episode) {
    return NextResponse.json(
      { error: "Missing romaji or episode" },
      { status: 400 },
    );
  }

  try {
    const paddedEp = episode.padStart(2, "0");
    const query = `${romaji} ${paddedEp}`;

    console.log(`[Episode Search] Searching: ${query}`);

    const results = await downloaderService.searchNyaa(
      query,
      "seeders",
      "desc",
    );

    return NextResponse.json({ results: results || [] });
  } catch (err: any) {
    console.error(
      `[Episode Search] Error searching for ${romaji} ${episode}:`,
      err,
    );
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
