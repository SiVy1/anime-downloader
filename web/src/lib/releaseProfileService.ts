import { connectDB } from "./db";
import {
  Anime,
  IAnime,
  IReleaseProfile,
  DEFAULT_RELEASE_PROFILE,
} from "@/models/Anime";

// Re-export IReleaseProfile for use in other services
export type { IReleaseProfile } from "@/models/Anime";

/**
 * Global Settings Model - stores app-wide defaults
 */
import mongoose, { Schema, Document } from "mongoose";

export interface IGlobalSettings extends Document {
  key: string;
  defaultReleaseProfile: IReleaseProfile;
}

const GlobalSettingsSchema = new Schema({
  key: { type: String, required: true, unique: true },
  defaultReleaseProfile: {
    preferredGroups: { type: [String], default: ["SubsPlease", "Erai-raws"] },
    preferredQuality: { type: String, default: "1080p" },
    excludeGroups: { type: [String], default: [] },
    autoDownload: { type: Boolean, default: true },
  },
});

const GlobalSettings =
  mongoose.models.GlobalSettings ||
  mongoose.model<IGlobalSettings>("GlobalSettings", GlobalSettingsSchema);

const SETTINGS_KEY = "global";

/**
 * Get the global default release profile
 */
export async function getGlobalDefaultProfile(): Promise<IReleaseProfile> {
  await connectDB();
  const settings = await GlobalSettings.findOne({ key: SETTINGS_KEY });
  return settings?.defaultReleaseProfile || DEFAULT_RELEASE_PROFILE;
}

/**
 * Update the global default release profile
 */
export async function updateGlobalDefaultProfile(
  profile: Partial<IReleaseProfile>,
): Promise<IReleaseProfile> {
  await connectDB();

  const updated = await GlobalSettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    {
      $set: {
        "defaultReleaseProfile.preferredGroups": profile.preferredGroups,
        "defaultReleaseProfile.preferredQuality": profile.preferredQuality,
        "defaultReleaseProfile.excludeGroups": profile.excludeGroups,
        "defaultReleaseProfile.autoDownload": profile.autoDownload,
      },
    },
    { upsert: true, new: true },
  );

  return updated.defaultReleaseProfile;
}

/**
 * Get release profile for a specific anime
 * Falls back to global default if anime has no custom profile
 */
export async function getReleaseProfile(
  malId: number,
): Promise<IReleaseProfile> {
  await connectDB();
  const anime = await Anime.findOne({ malId });

  if (anime?.releaseProfile) {
    return anime.releaseProfile;
  }

  return getGlobalDefaultProfile();
}

/**
 * Update release profile for a specific anime
 */
export async function updateReleaseProfile(
  malId: number,
  profile: Partial<IReleaseProfile>,
): Promise<IAnime | null> {
  await connectDB();

  const anime = await Anime.findOneAndUpdate(
    { malId },
    {
      $set: {
        "releaseProfile.preferredGroups": profile.preferredGroups,
        "releaseProfile.preferredQuality": profile.preferredQuality,
        "releaseProfile.excludeGroups": profile.excludeGroups,
        "releaseProfile.autoDownload": profile.autoDownload,
      },
    },
    { new: true },
  );

  return anime;
}

/**
 * Check if a torrent title matches the release profile preferences
 * Returns a score (higher = better match)
 */
export function scoreTorrentMatch(
  torrentTitle: string,
  profile: IReleaseProfile,
): number {
  const title = torrentTitle.toLowerCase();
  let score = 0;

  // Check preferred groups (highest priority)
  for (const group of profile.preferredGroups) {
    if (title.includes(`[${group.toLowerCase()}]`)) {
      score += 100;
      break;
    }
  }

  // Check excluded groups (disqualify)
  for (const group of profile.excludeGroups) {
    if (title.includes(`[${group.toLowerCase()}]`)) {
      return -1; // Disqualified
    }
  }

  // Check quality
  const quality = profile.preferredQuality.toLowerCase();
  if (title.includes(quality)) {
    score += 50;
  }

  // Bonus for specific quality matches
  if (
    quality === "1080p" &&
    (title.includes("1080p") || title.includes("1080"))
  ) {
    score += 50;
  } else if (
    quality === "720p" &&
    (title.includes("720p") || title.includes("720"))
  ) {
    score += 50;
  } else if (
    quality === "4k" &&
    (title.includes("2160p") || title.includes("4k"))
  ) {
    score += 50;
  }

  // Small bonus for having seeders count in title (batch releases)
  if (title.includes("batch")) {
    score -= 20; // Prefer individual episodes over batches
  }

  return score;
}

/**
 * Filter and sort torrents by release profile preferences
 */
export function filterAndSortByProfile(
  torrents: Array<{ title: string; [key: string]: any }>,
  profile: IReleaseProfile,
): Array<{ title: string; score: number; [key: string]: any }> {
  return torrents
    .map((torrent) => ({
      ...torrent,
      score: scoreTorrentMatch(torrent.title, profile),
    }))
    .filter((t) => t.score >= 0) // Remove disqualified
    .sort((a, b) => b.score - a.score); // Best matches first
}
