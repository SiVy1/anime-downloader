import { NextRequest, NextResponse } from "next/server";
import { searchNyaa } from "@/lib/downloader";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const sort = req.nextUrl.searchParams.get("sort") || "seeders";
  const order = req.nextUrl.searchParams.get("order") || "desc";

  if (!q)
    return NextResponse.json({ error: "Brak zapytania" }, { status: 400 });

  const results = await searchNyaa(q, sort, order);
  return NextResponse.json({ count: results.length, data: results });
}
