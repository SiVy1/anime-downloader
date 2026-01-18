import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Anime, Episode } from "@/models/Anime";
import { linkFolderToAnime } from "@/lib/libraryService";
import { notifyEpisodeDownloaded } from "@/lib/notificationService";

/**
 * qBittorrent Webhook Endpoint
 * 
 * Triggered by qBittorrent when a download finishes.
 * Expected query params: ?name=%N&hash=%I&category=%L
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    const hash = searchParams.get("hash");
    const category = searchParams.get("category"); // This should correspond to localFolderName

    console.log(`[Webhook:qBit] Torrent finished: ${name} (${hash}) in category: ${category}`);

    if (!category) {
      return NextResponse.json({ error: "No category/folder provided" }, { status: 400 });
    }

    await connectDB();

    // 1. Find the anime associated with this folder
    const anime = await Anime.findOne({ localFolderName: category });

    if (!anime) {
      console.log(`[Webhook:qBit] No anime found for folder: ${category}`);
      return NextResponse.json({ message: "No matching anime found" });
    }

    // 2. Trigger library sync for this anime
    console.log(`[Webhook:qBit] Syncing library for: ${anime.title}`);
    const result = await linkFolderToAnime(anime.anilistId, category);

    // 3. Send notification
    // Try to find if we just mapped a new episode
    if (result.success && result.episodesMapped > 0) {
      // Find the latest downloaded episode for this anime to get its number
      const latestEpisode = await Episode.findOne({ 
        animeId: anime._id, 
        isDownloaded: true 
      }).sort({ number: -1 });

      if (latestEpisode) {
        await notifyEpisodeDownloaded(
          anime.title, 
          latestEpisode.number, 
          anime.images?.webp?.image_url
        );
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Webhook processed",
      synced: result.episodesMapped
    });

  } catch (error: any) {
    console.error("[Webhook:qBit] Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
