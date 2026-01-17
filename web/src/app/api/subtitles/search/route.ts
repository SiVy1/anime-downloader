import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { animeSubtitleService } from "@/lib/animeSubtitleService";
import { polishSubtitleService } from "@/lib/polishSubtitleService";
import env from "@/lib/env";

const OPENSUBTITLES_API_URL = "https://api.opensubtitles.com/api/v1";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const results: any[] = [];
  const note: string[] = [];

  // --- Source 1: AnimeSubtitleService (Anime Tosho - English/Multi) ---
  try {
    const toshoSubs = await animeSubtitleService.findSubtitles(query);
    if (toshoSubs) {
      results.push({
        id: `tosho-${toshoSubs.source.tosho_id}`,
        attributes: {
          language: "en",
          url: toshoSubs.url,
          release: toshoSubs.source.title,
          source: "AnimeTosho (Exact Match)",
          match_type: toshoSubs.source.match_type,
        },
      });
    }
  } catch (err) {
    console.error("AnimeSubtitleService Error:", err);
  }

  // --- Source 2: PolishSubtitleService (AniSub.info - Polish) ---
  try {
    const polishSubs = await polishSubtitleService.findPolishSubtitles(query);
    polishSubs.forEach((sub: any) => {
      results.push({
        id: `animesub-${sub.source.tosho_id}`,
        attributes: {
          language: "pl",
          url: sub.url,
          release: sub.source.title,
          source: "AniSub.info (Polish)",
          match_type: sub.source.match_type,
        },
      });
    });
  } catch (err) {
    console.error("PolishSubtitleService Error:", err);
  }

  // --- Source 3: OpenSubtitles (Generic) ---
  const apiKey = env.subtitles.openSubtitlesKey;
  if (apiKey) {
    try {
      const response = await axios.get(`${OPENSUBTITLES_API_URL}/subtitles`, {
        params: { query, languages: "pl,en" },
        headers: {
          "Api-Key": apiKey,
          "User-Agent": "AniStream v1.0",
        },
      });

      if (response.data.data) {
        response.data.data.forEach((sub: any) => {
          results.push({
            ...sub,
            attributes: {
              ...sub.attributes,
              source: "OpenSubtitles",
            },
          });
        });
      }
    } catch (error: any) {
      console.error("OpenSubtitles Search Error:", error.message);
      note.push(`OpenSubtitles error: ${error.message}`);
    }
  } else {
    note.push(
      "Podaj OPENSUBTITLES_API_KEY w .env.local, aby wyszukiwać napisy na OpenSubtitles.",
    );
  }

  return NextResponse.json({
    subtitles: results,
    note: note.join(" | "),
  });
}
