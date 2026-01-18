import { NextRequest, NextResponse } from "next/server";
import { searchAnimeFull } from "@/lib/anilistService";
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

    // 1. Search AniList (Service uses Redis cache internally)
    const results = await searchAnimeFull(query);

    // 2. Check if any of these results already exist in our DB
    // to show badges like "In Library"
    const anilistIds = results.map((r) => r.id);
    const existingAnime = await Anime.find({
      anilistId: { $in: anilistIds },
    }).select("anilistId localFolderName");

    const augmentedResults = results.map((r) => {
      const local = existingAnime.find((a) => a.anilistId === r.id);
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
