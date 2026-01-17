import { connectDB } from "./db";
import { Episode, IEpisode } from "@/models/Anime";

/**
 * EpisodeService - Handles episode-level operations
 *
 * Responsibilities:
 * - Toggling watch status
 * - Updating episode metadata
 */

export interface ToggleWatchedResult {
  success: boolean;
  watched: boolean;
  episodeId: string;
  error?: string;
}

/**
 * Toggle or set the watched status of an episode
 *
 * @param episodeId - MongoDB ObjectId of the episode
 * @param watchedState - Optional explicit state. If undefined, toggles current state.
 * @returns Result with new watched state
 */
export async function toggleEpisodeWatched(
  episodeId: string,
  watchedState?: boolean,
): Promise<ToggleWatchedResult> {
  await connectDB();

  const episode = await Episode.findById(episodeId);

  if (!episode) {
    return {
      success: false,
      watched: false,
      episodeId,
      error: "Episode not found",
    };
  }

  // Determine new state: explicit value or toggle
  const newWatchedState =
    typeof watchedState === "boolean" ? watchedState : !episode.watched;

  episode.watched = newWatchedState;
  await episode.save();

  return {
    success: true,
    watched: episode.watched,
    episodeId,
  };
}

/**
 * Mark multiple episodes as watched
 *
 * @param episodeIds - Array of MongoDB ObjectIds
 * @param watched - Whether to mark as watched or unwatched
 */
export async function bulkSetWatched(
  episodeIds: string[],
  watched: boolean,
): Promise<number> {
  await connectDB();

  const result = await Episode.updateMany(
    { _id: { $in: episodeIds } },
    { $set: { watched } },
  );

  return result.modifiedCount;
}

/**
 * Get episode by ID
 */
export async function getEpisodeById(
  episodeId: string,
): Promise<IEpisode | null> {
  await connectDB();
  return Episode.findById(episodeId);
}

/**
 * Get all episodes for an anime
 */
export async function getEpisodesForAnime(
  animeId: string,
): Promise<IEpisode[]> {
  await connectDB();
  return Episode.find({ animeId }).sort({ number: 1 });
}
