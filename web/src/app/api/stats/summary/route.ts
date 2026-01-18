import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Anime, Episode } from "@/models/Anime";
import { ARIA2_PATH } from "@/lib/downloader";
import fs from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // 1. Library Stats
    const totalAnime = await Anime.countDocuments();
    const totalEpisodes = await Episode.countDocuments({ isDownloaded: true });
    const watchedEpisodes = await Episode.countDocuments({ watched: true });

    // 2. Disk Usage
    let diskStats = { total: 0, free: 0, used: 0, percent: 0 };
    if (ARIA2_PATH) {
      try {
        const stats = await fs.statfs(ARIA2_PATH);
        const total = stats.bsize * stats.blocks;
        const free = stats.bsize * stats.bfree;
        const used = total - free;
        diskStats = {
          total,
          free,
          used,
          percent: Math.round((used / total) * 100),
        };
      } catch (err) {
        console.error("[StatsAPI] Error getting disk stats:", err);
      }
    }

    // 3. Recent Activity (Group by day for the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentDownloadsRaw = await Episode.aggregate([
      {
        $match: {
          isDownloaded: true,
          downloadedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$downloadedAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing days with 0
    const recentActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const found = recentDownloadsRaw.find((d) => d._id === dateStr);
      recentActivity.push({
        date: dateStr,
        count: found ? found.count : 0,
      });
    }

    // 4. Last 5 Added Anime
    const latestAnime = await Anime.find({})
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("title images anilistId updatedAt");

    return NextResponse.json({
      library: {
        totalAnime,
        totalEpisodes,
        watchedEpisodes,
        percentWatched: totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0,
      },
      disk: diskStats,
      activity: recentActivity,
      latestAnime,
    });
  } catch (error) {
    console.error("[StatsAPI] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
