import { NextRequest, NextResponse } from "next/server";
import { searchNyaa } from "@/lib/downloader";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const sort = req.nextUrl.searchParams.get("sort") || "seeders";
  const order = req.nextUrl.searchParams.get("order") || "desc";

  if (!q) {
    return NextResponse.json(
      { error: "Missing query parameter" },
      { status: 400 },
    );
  }

  try {
    const results = await searchNyaa(q, sort, order);
    return NextResponse.json({ count: results.length, data: results });
  } catch (error) {
    console.error("[API /downloader/search] Error:", error);
    return NextResponse.json(
      { error: "Failed to search torrents" },
      { status: 500 },
    );
  }
}
