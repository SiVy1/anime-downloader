import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const OPENSUBTITLES_API_URL = "https://api.opensubtitles.com/api/v1";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const apiKey = process.env.OPENSUBTITLES_API_KEY;
  if (!apiKey) {
    // Jeśli brak klucza, zwracamy pustą listę zamiast błędu 500
    return NextResponse.json({
      subtitles: [],
      note: "Podaj OPENSUBTITLES_API_KEY w .env.local, aby wyszukiwać napisy.",
    });
  }

  try {
    const response = await axios.get(`${OPENSUBTITLES_API_URL}/subtitles`, {
      params: { query, languages: "pl,en" },
      headers: {
        "Api-Key": apiKey,
        "User-Agent": "AniStream v1.0",
      },
    });

    return NextResponse.json({ subtitles: response.data.data });
  } catch (error: any) {
    console.error("OpenSubtitles Search Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
