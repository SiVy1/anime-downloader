import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Anime, Episode } from "@/models/Anime";
import { getAnimeById, getAnimeEpisodes } from "@/lib/jikanService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const malId = parseInt(id, 10);

  try {
    await connectDB();

    // Check if already in library
    let anime = await Anime.findOne({ malId });

    if (anime) {
      return NextResponse.json({
        success: true,
        message: "Already in library",
        anime,
      });
    }

    // Fetch from Jikan
    const jikanData: any = await getAnimeById(malId);
    if (!jikanData) {
      return NextResponse.json(
        { error: "Anime not found on MAL" },
        { status: 404 },
      );
    }

    // Save anime to database
    anime = new Anime({
      malId: jikanData.mal_id,
      title: jikanData.title,
      titleEnglish: jikanData.title_english,
      titleJapanese: jikanData.title_japanese,
      synopsis: jikanData.synopsis,
      score: jikanData.score,
      images: jikanData.images,
      genres: jikanData.genres?.map((g: any) => g.name) || [],
      episodesCount: jikanData.episodes,
      status: jikanData.status,
      type: jikanData.type,
      // No folder linking - can be done later
      localFolderName: null,
    });

    await anime.save();

    // Fetch and save episodes
    const episodes = await getAnimeEpisodes(malId);
    if (episodes && episodes.length > 0) {
      const episodeDocs = episodes.map((ep: any) => ({
        animeId: anime._id,
        number: parseInt(ep.episode || ep.mal_id, 10),
        title: ep.title,
        airedDate: ep.aired,
        isDownloaded: false,
        watched: false,
      }));

      await Episode.insertMany(episodeDocs, { ordered: false }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: "Added to library",
      anime,
    });
  } catch (error: any) {
    console.error("[Add to Library API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
