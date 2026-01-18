import mongoose, { Schema, Document } from "mongoose";

// Release Profile - preferences for auto-downloading
export interface IReleaseProfile {
  preferredGroups: string[]; // e.g., ["SubsPlease", "Erai-raws"]
  preferredQuality: string; // e.g., "1080p", "720p", "4k"
  excludeGroups: string[]; // Groups to avoid
  autoDownload: boolean; // Master switch for auto-download
}

// Default release profile (used when anime has no custom profile)
export const DEFAULT_RELEASE_PROFILE: IReleaseProfile = {
  preferredGroups: ["SubsPlease", "Erai-raws"],
  preferredQuality: "1080p",
  excludeGroups: [],
  autoDownload: true,
};

export interface IAnime extends Document {
  anilistId: number;
  title: string;
  images: {
    webp: {
      image_url: string;
      large_image_url: string;
    };
  };
  synopsis: string;
  type: string;
  episodesCount: number;
  status: string;
  genres: string[];
  score: number;
  localFolderName?: string; // Links to the directory in ARIA2_PATH
  // PVR fields
  isSubscribed?: boolean; // Whether auto-download is enabled
  releaseProfile?: IReleaseProfile; // Custom release preferences
  lastEpisodeCheck?: Date; // Last time PVR checked for new episodes
  updatedAt: Date;
}

const AnimeSchema: Schema = new Schema({
  anilistId: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  images: {
    webp: {
      image_url: String,
      large_image_url: String,
    },
  },
  synopsis: String,
  type: String,
  episodesCount: Number,
  status: String,
  genres: [String],
  score: Number,
  localFolderName: String,
  // PVR fields
  isSubscribed: { type: Boolean, default: false },
  releaseProfile: {
    preferredGroups: { type: [String], default: ["SubsPlease", "Erai-raws"] },
    preferredQuality: { type: String, default: "1080p" },
    excludeGroups: { type: [String], default: [] },
    autoDownload: { type: Boolean, default: true },
  },
  lastEpisodeCheck: Date,
  updatedAt: { type: Date, default: Date.now },
});

export const Anime =
  mongoose.models.Anime || mongoose.model<IAnime>("Anime", AnimeSchema);

export interface IEpisode extends Document {
  animeId: mongoose.Types.ObjectId;
  number: number;
  title: string;
  airedDate?: string;
  localPath?: string; // Relative path to ARIA2_PATH
  isDownloaded: boolean;
  watched: boolean;
  duration?: number;
}

const EpisodeSchema: Schema = new Schema({
  animeId: { type: Schema.Types.ObjectId, ref: "Anime", required: true },
  number: { type: Number, required: true },
  title: { type: String },
  airedDate: String,
  localPath: String,
  isDownloaded: { type: Boolean, default: false },
  watched: { type: Boolean, default: false },
  duration: Number,
});

// Compound index to ensure episode numbers are unique per anime
EpisodeSchema.index({ animeId: 1, number: 1 }, { unique: true });

export const Episode =
  mongoose.models.Episode || mongoose.model<IEpisode>("Episode", EpisodeSchema);
