import { NextRequest, NextResponse } from "next/server";
import { addToAria2 } from "@/lib/downloader";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { magnet, magnets, title, subfolder } = body;
    const finalTitle = title || subfolder;

    if ((!magnet && !magnets) || !finalTitle) {
      return NextResponse.json(
        { error: "Brak magnetu lub tytułu" },
        { status: 400 },
      );
    }

    const safeTitle = finalTitle.replace(/[^a-z0-9 ._-]/gi, "").trim();
    const magnetLinks = Array.isArray(magnets)
      ? magnets
      : Array.isArray(magnet)
        ? magnet
        : [magnet];
    const gids = await addToAria2(magnetLinks, safeTitle);

    if (!gids) {
      return NextResponse.json(
        { error: "Błąd podczas dodawania do Aria2" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      status: "success",
      message: `Dodano torrent do Aria2 (Folder: ${safeTitle})`,
      folder: safeTitle,
      gids: gids,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
