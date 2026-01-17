import { NextRequest, NextResponse } from "next/server";
import { downloaderService } from "@/lib/downloader";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { magnet, magnets, title, subfolder } = body;
    const finalTitle = title || subfolder;

    if ((!magnet && !magnets) || !finalTitle) {
      return NextResponse.json(
        { error: "Missing magnet or title" },
        { status: 400 },
      );
    }

    const safeTitle = finalTitle.replace(/[^a-z0-9 ._-]/gi, "").trim();
    const magnetLinks = Array.isArray(magnets)
      ? magnets
      : Array.isArray(magnet)
        ? magnet
        : [magnet];

    // Use downloaderService singleton instead of legacy function
    const hashes = await downloaderService.addTorrent(magnetLinks, safeTitle);

    if (!hashes) {
      return NextResponse.json(
        { error: "Failed to add torrent to qBittorrent" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      status: "success",
      message: `Torrent added to qBittorrent (Subfolder: ${safeTitle})`,
      folder: safeTitle,
      hashes: hashes,
    });
  } catch (error: any) {
    console.error("[API /downloader/download-magnet] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
