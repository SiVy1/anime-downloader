import { NextRequest, NextResponse } from "next/server";
import { downloaderService } from "@/lib/downloader";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");
  const romaji = searchParams.get("romaji");
  const episode = searchParams.get("episode");
  const quality = searchParams.get("quality") || "1080p";
  const subCategory = searchParams.get("sub_category") || "eng";

  if ((!title && !romaji) || !episode) {
    return NextResponse.json(
      { error: "Missing title/romaji or episode" },
      { status: 400 },
    );
  }

  try {
    const paddedEp = episode.padStart(2, "0");

    // Prioritize romaji for search as requested by user
    const baseTitle = romaji || title;
    const query = `${baseTitle} ${paddedEp}`;

    console.log(`[Episode Search] Searching for: ${query} (${quality})`);

    // Use existing Nyaa search with specific quality
    let results = await downloaderService.searchNyaa(
      query,
      "seeders",
      "desc",
      quality,
      subCategory,
    );

    // If no results, and we were filtering by subCategory, try one more time without filter
    if ((!results || results.length === 0) && subCategory === "eng") {
      console.log(
        `[Episode Search] No results with 'eng' filter, retrying without sub-category filter...`,
      );
      results = await downloaderService.searchNyaa(
        query,
        "seeders",
        "desc",
        quality,
        "", // No sub-category filter
      );
    }

    // If still no results and we have an English title, try fallback
    if (
      (!results || results.length === 0) &&
      romaji &&
      title &&
      romaji !== title
    ) {
      console.log(
        `[Episode Search] No results for romaji, trying fallback: ${title} ${paddedEp}`,
      );
      results = await downloaderService.searchNyaa(
        `${title} ${paddedEp}`,
        "seeders",
        "desc",
        quality,
        subCategory,
      );
    }

    return NextResponse.json({ results: results || [] });
  } catch (err: any) {
    console.error(
      `[Episode Search] Error searching for ${title || romaji} ${episode}:`,
      err,
    );
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
