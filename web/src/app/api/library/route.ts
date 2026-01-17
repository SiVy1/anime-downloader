import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { promises as fsp } from "fs";
import { ARIA2_PATH } from "@/lib/downloader";
import { autoConverter } from "@/lib/autoConverter";
import { exists } from "@/lib/utils/filesystem";
import { connectDB } from "@/lib/db";
import { Anime } from "@/models/Anime";

export async function GET() {
  // Start background auto-converter if not already running
  autoConverter.start();

  try {
    await connectDB();

    // 1. Get anime from database (primary source)
    const dbAnime = await Anime.find({}).sort({ updatedAt: -1 });

    // 2. Get folders from disk (for linking purposes)
    let diskFolders: string[] = [];
    if (ARIA2_PATH && (await exists(ARIA2_PATH))) {
      const items = await fsp.readdir(ARIA2_PATH, { withFileTypes: true });
      diskFolders = items
        .filter((item) => item.isDirectory())
        .map((item) => item.name);
    }

    // 3. Find unlinked folders (folders on disk not linked to any anime)
    const linkedFolders = new Set(
      dbAnime.map((a) => a.localFolderName).filter(Boolean),
    );
    const unlinkedFolders = diskFolders.filter((f) => !linkedFolders.has(f));

    return NextResponse.json({
      anime: dbAnime,
      folders: diskFolders,
      unlinkedFolders,
    });
  } catch (error: any) {
    console.error("[Library API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
