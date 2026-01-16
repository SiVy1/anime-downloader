import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("file_id");

  if (!fileId) {
    return NextResponse.json({ error: "Missing file_id" }, { status: 400 });
  }

  const apiKey = process.env.OPENSUBTITLES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API Key not configured" },
      { status: 500 },
    );
  }

  try {
    // 1. Pobierz link do downloadu z OpenSubtitles
    const downloadRes = await axios.post(
      "https://api.opensubtitles.com/api/v1/download",
      { file_id: parseInt(fileId) },
      {
        headers: {
          "Api-Key": apiKey,
          "User-Agent": "AniStream v1.0",
        },
      },
    );

    const downloadUrl = downloadRes.data.link;

    // 2. Pobierz treść napisów
    const subtitleRes = await axios.get(downloadUrl);
    let content = subtitleRes.data;

    // 3. Prosta konwersja SRT na VTT (jeśli potrzebna)
    // Przeglądarki wolą VTT
    if (content.includes(" --> ") && !content.startsWith("WEBVTT")) {
      content = "WEBVTT\n\n" + content.replace(/(\d+:\d+:\d+),(\d+)/g, "$1.$2");
    }

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/vtt",
        "Content-Disposition": 'attachment; filename="subtitles.vtt"',
      },
    });
  } catch (error: any) {
    console.error("OpenSubtitles Download Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
