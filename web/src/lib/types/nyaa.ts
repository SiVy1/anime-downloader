/**
 * Type definitions for Nyaa torrent search API responses.
 */

/** Raw response from the Nyaa API */
export interface NyaaApiResponse {
  data: NyaaRawEntry[];
}

/** Raw entry from Nyaa API before processing */
export interface NyaaRawEntry {
  title: string;
  link: string;
  seeders: number;
  leechers: number;
  size: string;
  date: string;
  magnet: string;
  torrent?: string;
}

/** Processed Nyaa search result with additional metadata */
export interface NyaaSearchResult extends NyaaRawEntry {
  id: string;
  hash: string;
  extension: string;
  isHevc: boolean;
  isAvc: boolean;
}
