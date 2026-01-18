import { connectDB } from "./db";
import { getAnimeById } from "./anilistService";
import { Anime, Episode, IAnime, IEpisode } from "@/models/Anime";
import { downloaderService } from "./downloader";
import {
  getReleaseProfile,
  filterAndSortByProfile,
  IReleaseProfile,
} from "./releaseProfileService";
import { extractEpisodeNumber } from "./animeParser";

/**
 * PVR Service - Personal Video Recorder functionality
 *
 * Handles automatic episode detection and downloading for subscribed anime.
 * Designed to be called periodically via cron job (Linux) or API trigger.
 */

// Minimum delay between checks for each anime (in ms)
const MIN_CHECK_DELAY = 30000; // 30 seconds

// Store last check times to prevent hammering Nyaa
const lastCheckTimes = new Map<number, number>();

export interface PVRCheckResult {
  anilistId: number;
  title: string;
  episodesFound: number;
  episodesDownloaded: number;
  errors: string[];
}

/**
 * Get all anime with subscriptions enabled
 */
export async function getSubscribedAnime(): Promise<IAnime[]> {
  await connectDB();
  return Anime.find({ isSubscribed: true });
}

/**
 * Toggle subscription status for an anime
 */
export async function toggleSubscription(
  anilistId: number,
): Promise<IAnime | null> {
  await connectDB();
  const anime = await Anime.findOne({ anilistId });

  if (!anime) return null;

  anime.isSubscribed = !anime.isSubscribed;
  await anime.save();

  console.log(
    `[PVR] Subscription ${anime.isSubscribed ? "enabled" : "disabled"} for ${anime.title}`,
  );
  return anime;
}

/**
 * Set subscription status explicitly
 */
export async function setSubscription(
  anilistId: number,
  subscribed: boolean,
): Promise<IAnime | null> {
  await connectDB();
  const anime = await Anime.findOneAndUpdate(
    { anilistId },
    { $set: { isSubscribed: subscribed } },
    { new: true },
  );

  if (anime) {
    console.log(`[PVR] Subscription set to ${subscribed} for ${anime.title}`);
  }
  return anime;
}

/**
 * Check if we should wait before checking this anime again
 */
function shouldThrottle(anilistId: number): boolean {
  const lastCheck = lastCheckTimes.get(anilistId);
  if (!lastCheck) return false;
  return Date.now() - lastCheck < MIN_CHECK_DELAY;
}

/**
 * Find missing episodes for an anime
 */
async function getMissingEpisodes(anime: IAnime): Promise<IEpisode[]> {
  await connectDB();
  const episodes = await Episode.find({
    animeId: anime._id,
    isDownloaded: false,
  }).sort({ number: 1 });

  return episodes;
}

/**
 * Search for a specific episode on Nyaa
 */
async function searchEpisode(
  animeTitle: string,
  episodeNumber: number,
  profile: IReleaseProfile,
): Promise<{ magnet: string; title: string } | null> {
  // Build search query with episode number
  const paddedEp = episodeNumber.toString().padStart(2, "0");

  // Use Romaji title if possible for better matching on Nyaa
  const query = `${animeTitle} ${paddedEp}`;
  const quality = profile.preferredQuality || "1080p";

  try {
    const results = await downloaderService.searchNyaa(
      query,
      "seeders",
      "desc",
      quality,
    );

    if (results.length === 0) {
      return null;
    }

    // Filter by episode number in title
    const episodeResults = results.filter((r) => {
      const epNum = extractEpisodeNumber(r.title);
      return epNum === episodeNumber;
    });

    if (episodeResults.length === 0) {
      return null;
    }

    // Apply release profile filtering
    const scored = filterAndSortByProfile(episodeResults, profile);

    if (scored.length === 0) {
      return null;
    }

    const best = scored[0];
    return {
      magnet: best.magnet,
      title: best.title,
    };
  } catch (error) {
    console.error(`[PVR] Search failed for ${query}:`, error);
    return null;
  }
}

/**
 * Check a single anime for new episodes and download if found
 */
export async function checkAnimeForNewEpisodes(
  anime: IAnime,
): Promise<PVRCheckResult> {
  const result: PVRCheckResult = {
    anilistId: anime.anilistId,
    title: anime.titleRomaji || anime.title,
    episodesFound: 0,
    episodesDownloaded: 0,
    errors: [],
  };

  // Throttle checks
  if (shouldThrottle(anime.anilistId)) {
    result.errors.push("Throttled - checked too recently");
    return result;
  }

  // Get release profile
  const profile = await getReleaseProfile(anime.anilistId);

  if (!profile.autoDownload) {
    result.errors.push("Auto-download disabled in profile");
    return result;
  }

  // Find missing episodes
  const missingEpisodes = await getMissingEpisodes(anime);

  if (missingEpisodes.length === 0) {
    return result;
  }

  console.log(
    `[PVR] Checking ${anime.title}: ${missingEpisodes.length} missing episodes`,
  );

  // Update last check time
  lastCheckTimes.set(anime.anilistId, Date.now());

  // Check for each missing episode (limit to first 3 to avoid rate limiting)
  const toCheck = missingEpisodes.slice(0, 3);

  for (const episode of toCheck) {
    try {
      const match = await searchEpisode(
        anime.titleRomaji || anime.title,
        episode.number,
        profile,
      );

      if (match) {
        result.episodesFound++;

        // Create subfolder name from anime title
        const subfolder =
          anime.localFolderName || anime.title.replace(/[<>:"/\\|?*]/g, "");

        // Add torrent to qBittorrent
        const hashes = await downloaderService.addTorrent(
          [match.magnet],
          subfolder,
        );

        if (hashes && hashes.length > 0) {
          result.episodesDownloaded++;
          console.log(`[PVR] Downloaded: ${match.title}`);
        } else {
          result.errors.push(
            `Failed to add torrent for episode ${episode.number}`,
          );
        }
      }

      // Small delay between episode searches
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error: any) {
      result.errors.push(`Episode ${episode.number}: ${error.message}`);
    }
  }

  // Update last check time in database
  await Anime.updateOne(
    { anilistId: anime.anilistId },
    { $set: { lastEpisodeCheck: new Date() } },
  );

  return result;
}

/**
 * Run full PVR cycle for all subscribed anime
 */
export async function runPVRCycle(): Promise<PVRCheckResult[]> {
  console.log("[PVR] Starting PVR cycle...");

  const subscribedAnime = await getSubscribedAnime();
  console.log(`[PVR] Found ${subscribedAnime.length} subscribed anime`);

  const results: PVRCheckResult[] = [];

  for (const animeDoc of subscribedAnime) {
    try {
      // Refresh metadata if needed (e.g. missing titleRomaji) before checking
      const anime = (await getAnimeById(animeDoc.anilistId, true)) || animeDoc;
      const result = await checkAnimeForNewEpisodes(anime);
      results.push(result);

      // Delay between anime checks
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error: any) {
      console.error(`[PVR] Error checking ${animeDoc.title}:`, error);
      results.push({
        anilistId: animeDoc.anilistId,
        title: animeDoc.title,
        episodesFound: 0,
        episodesDownloaded: 0,
        errors: [error.message],
      });
    }
  }

  const totalDownloaded = results.reduce(
    (sum, r) => sum + r.episodesDownloaded,
    0,
  );
  console.log(`[PVR] Cycle complete. Downloaded ${totalDownloaded} episodes.`);

  return results;
}

/**
 * Get PVR status summary
 */
export async function getPVRStatus(): Promise<{
  subscribedCount: number;
  lastCycleTime?: Date;
  anime: Array<{ anilistId: number; title: string; lastCheck?: Date }>;
}> {
  const subscribedAnime = await getSubscribedAnime();

  return {
    subscribedCount: subscribedAnime.length,
    anime: subscribedAnime.map((a) => ({
      anilistId: a.anilistId,
      title: a.title,
      lastCheck: a.lastEpisodeCheck,
    })),
  };
}
