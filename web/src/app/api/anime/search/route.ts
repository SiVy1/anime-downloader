import { NextRequest, NextResponse } from "next/server";
import { searchAnimeFull } from "@/lib/jikanService";
import { connectDB } from "@/lib/db";
import { Anime } from "@/models/Anime";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    await connectDB();

    // 1. Search Jikan (Service uses Redis cache internally)
    const results = await searchAnimeFull(query);

    // 2. We don't save everything to DB yet, only when user clicks an anime.
    // However, we can check if any of these results already exist in our DB
    // to show badges like "In Library"
    const malIds = results.map((r) => r.mal_id);
    const existingAnime = await Anime.find({ malId: { $in: malIds } }).select(
      "malId localFolderName",
    );

    const augmentedResults = results.map((r) => {
      const local = existingAnime.find((a) => a.malId === r.mal_id);
      return {
        ...r,
        inLibrary: !!local,
        localFolderName: local?.localFolderName || null,
      };
    });

    return NextResponse.json({ results: augmentedResults });
  } catch (err: any) {
    console.error("[Search API] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
