/**
 * qBittorrent API Type Definitions
 */

export interface QBitTorrent {
  added_on: number;
  amount_left: number;
  auto_tmm: boolean;
  availability: number;
  category: string;
  completed: number;
  completion_on: number;
  content_path: string;
  dl_limit: number;
  dlspeed: number;
  download_path: string;
  downloaded: number;
  downloaded_session: number;
  eta: number;
  f_l_piece_prio: boolean;
  force_start: boolean;
  hash: string;
  infohash_v1: string;
  infohash_v2: string;
  last_activity: number;
  magnet_uri: string;
  max_ratio: number;
  max_seeding_time: number;
  name: string;
  num_complete: number;
  num_incomplete: number;
  num_leechs: number;
  num_seeds: number;
  priority: number;
  progress: number;
  ratio: number;
  ratio_limit: number;
  save_path: string;
  seeding_time: number;
  seeding_time_limit: number;
  seen_complete: number;
  seq_dl: boolean;
  size: number;
  state: string;
  super_seeding: boolean;
  tags: string;
  time_active: number;
  total_size: number;
  tracker: string;
  up_limit: number;
  uploaded: number;
  uploaded_session: number;
  upspeed: number;
}

export interface QBitFile {
  index: number;
  name: string;
  size: number;
  progress: number;
  priority: number;
  is_seed: boolean;
  piece_range: [number, number];
  availability: number;
}

/**
 * Normalized Download Status (Application facing)
 */
export type DownloadStatus = "active" | "complete" | "waiting" | "error";

export interface TorrentStatus {
  status: DownloadStatus;
  progress: string; // "XX.X"
  speed: string; // "XX.XX" MB/s
  total: string; // "XX.XX" MB
  completed: string; // "XX.XX" MB
  dir: string;
  name: string;
  error?: string;
}
