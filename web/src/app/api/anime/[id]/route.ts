import { NextRequest, NextResponse } from "next/server";
import { getAnimeById, getAnimeEpisodes } from "@/lib/jikanService";
import { connectDB } from "@/lib/db";
import { Anime, Episode } from "@/models/Anime";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: malIdStr } = await params;
  const malId = parseInt(malIdStr, 10);

  if (isNaN(malId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    await connectDB();

    // 1. Check if we have it in DB
    let anime = await Anime.findOne({ malId });

    // 2. If not or if old, fetch from Jikan and update
    if (!anime) {
      console.log(`[Anime API] Syncing new anime ID ${malId} from Jikan...`);
      const jikanData = await getAnimeById(malId);
      if (!jikanData)
        return NextResponse.json(
          { error: "Anime not found on Jikan" },
          { status: 404 },
        );

      anime = await Anime.create({
        malId: jikanData.mal_id,
        title: jikanData.title,
        images: jikanData.images,
        synopsis: jikanData.synopsis,
        type: jikanData.type,
        episodesCount: jikanData.episodes,
        status: jikanData.status,
        genres: jikanData.genres.map((g: any) => g.name),
        score: jikanData.score,
      });

      // 3. Fetch episodes as well
      const episodes = await getAnimeEpisodes(malId);
      if (episodes && episodes.length > 0) {
        const episodeDocs = episodes.map((ep: any) => ({
          animeId: anime._id,
          number: parseInt(ep.episode || ep.mal_id, 10),
          title: ep.title,
          airedDate: ep.aired,
        }));

        // Use insertMany with ordered: false to skip duplicates if any
        await Episode.insertMany(episodeDocs, { ordered: false }).catch(
          () => {},
        );
      }
    }

    // 4. Return combined data
    const episodes = await Episode.find({ animeId: anime._id }).sort({
      number: 1,
    });

    return NextResponse.json({ anime, episodes });
  } catch (err: any) {
    console.error(`[Anime API] Error for ID ${malId}:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
