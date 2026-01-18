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
        id: r.id,
        title: r.title.english || r.title.romaji,
        titleEnglish: r.title.english,
        titleRomaji: r.title.romaji,
        images: {
          jpg: {
            image_url: r.coverImage?.large,
            large_image_url: r.coverImage?.extraLarge || r.coverImage?.large,
          },
        },
        synopsis: r.description?.replace(/<[^>]*>/g, "").slice(0, 300) || "",
        score: r.averageScore ? r.averageScore / 10 : null,
        episodes: r.episodes,
        type: r.format,
        status: r.status,
        genres: r.genres || [],
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
