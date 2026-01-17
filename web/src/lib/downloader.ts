import axios, { AxiosError } from "axios";
import path from "path";
import { NyaaRawEntry, NyaaSearchResult } from "./types/nyaa";
import {
  QBitTorrent,
  QBitFile,
  TorrentStatus,
  DownloadStatus,
} from "./types/qbittorrent";

// Environment variables validation
const QBIT_URL = process.env.QBIT_URL || "http://localhost:8080";
const QBIT_USER = process.env.QBIT_USER;
const QBIT_PASS = process.env.QBIT_PASS;
export const ARIA2_PATH = process.env.ARIA2_PATH || "";

const NYAA_API = "https://nyaaapi.onrender.com/nyaa";

/**
 * DownloaderService - Singleton Service for Torrent Management
 *
 * Responsibilities:
 * - Session-based authentication with qBittorrent
 * - Torrent searching via Nyaa API
 * - Torrent lifecycle management (add, status, list)
 */
class DownloaderService {
  private sid: string | null = null;

  constructor() {
    if (!QBIT_USER || !QBIT_PASS) {
      console.warn(
        "[DownloaderService] CRITICAL: Missing QBIT_USER or QBIT_PASS environment variables.",
      );
    }
  }

  /**
   * Get or refresh qBittorrent SID
   */
  private async getAuthCookie(forceRefresh = false): Promise<string> {
    if (this.sid && !forceRefresh) return this.sid;

    if (!QBIT_USER || !QBIT_PASS) {
      throw new Error(
        "qBittorrent credentials not configured (QBIT_USER, QBIT_PASS)",
      );
    }

    try {
      const params = new URLSearchParams();
      params.append("username", QBIT_USER);
      params.append("password", QBIT_PASS);

      const res = await axios.post(`${QBIT_URL}/api/v2/auth/login`, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const cookie = res.headers["set-cookie"];
      if (!cookie) throw new Error("qBittorrent login failed: No SID returned");

      this.sid = cookie[0].split(";")[0];
      console.log("[qBit] Authenticated and session created.");
      return this.sid;
    } catch (error: any) {
      console.error("[qBit] Login error:", error.message);
      throw error;
    }
  }

  /**
   * Helper to extract info hash from magnet link
   */
  private getHashFromMagnet(magnet: string): string | null {
    const match = magnet.match(/xt=urn:btih:([a-z0-9]+)/i);
    return match ? match[1].toLowerCase() : null;
  }

  /**
   * Search Nyaa for anime torrents
   */
  public async searchNyaa(
    query: string,
    sortBy: string = "seeders",
    order: string = "desc",
  ): Promise<NyaaSearchResult[]> {
    try {
      const response = await axios.get(NYAA_API, {
        params: {
          q: `${query} 1080p`,
          category: "anime",
          sub_category: "eng",
          sort: sortBy,
          order: order,
        },
        timeout: 10000,
      });

      const rawResults: NyaaRawEntry[] = response.data.data || [];

      // Detect file extension and codec metadata
      const results: NyaaSearchResult[] = rawResults.map((item) => {
        const title = item.title.toLowerCase();

        const extMatch =
          title.match(/\.(mkv|mp4|avi|mov)\b/i) ||
          title.match(/\[(mkv|mp4|avi|mov)\]/i);
        const extension = extMatch ? extMatch[1].toLowerCase() : "unknown";

        const isHevc =
          title.includes("hevc") ||
          title.includes("h265") ||
          title.includes("h.265") ||
          title.includes("x265") ||
          title.includes("h 265");
        const isAvc =
          title.includes("h264") ||
          title.includes("h.264") ||
          title.includes("x264") ||
          title.includes("avc") ||
          title.includes("h 264");

        return {
          ...item,
          extension,
          isHevc,
          isAvc,
        };
      });

      // Sort: SubsPlease and Erai-raws to top
      return results.sort((a, b) => {
        const priorityGroups = ["subsplease", "erai-raws"];
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();

        const aHasPriority = priorityGroups.some((group) =>
          aTitle.includes(`[${group}]`),
        );
        const bHasPriority = priorityGroups.some((group) =>
          bTitle.includes(`[${group}]`),
        );

        if (aHasPriority && !bHasPriority) return -1;
        if (!aHasPriority && bHasPriority) return 1;

        if (sortBy === "size") {
          const parseSize = (s: string) => {
            const val = parseFloat(s);
            if (s.includes("GiB") || s.includes("GB")) return val * 1024;
            if (s.includes("MiB") || s.includes("MB")) return val;
            return val / 1024;
          };
          const sizeA = parseSize(a.size);
          const sizeB = parseSize(b.size);
          return order === "desc" ? sizeB - sizeA : sizeA - sizeB;
        }

        return 0;
      });
    } catch (error) {
      console.error("[Nyaa] Search error:", error);
      return [];
    }
  }

  /**
   * Add torrent by magnet link
   */
  public async addTorrent(
    magnetLinks: string[],
    subfolder: string = "",
  ): Promise<string[] | null> {
    const targetDir = path.join(ARIA2_PATH, subfolder).replace(/\\/g, "/");
    const hashes: string[] = [];

    try {
      const sid = await this.getAuthCookie();

      for (const magnet of magnetLinks) {
        const params = new URLSearchParams();
        params.append("urls", magnet);
        params.append("savepath", targetDir);
        params.append("sequentialDownload", "true");
        params.append("firstLastPiecePrio", "true");

        await axios.post(`${QBIT_URL}/api/v2/torrents/add`, params, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Cookie: sid,
          },
        });

        const hash = this.getHashFromMagnet(magnet);
        if (hash) hashes.push(hash);
      }
      return hashes;
    } catch (error: any) {
      // Retry once if 403 Forbidden (SID expired)
      if (error.response?.status === 403) {
        console.warn("[qBit] SID expired, retrying login...");
        this.sid = null;
        return this.addTorrent(magnetLinks, subfolder);
      }
      console.error("[qBit] Error adding torrent:", error.message);
      return null;
    }
  }

  /**
   * Get torrent status by hash
   */
  public async getTorrentStatus(hash: string): Promise<TorrentStatus> {
    try {
      const sid = await this.getAuthCookie();
      const res = await axios.get(`${QBIT_URL}/api/v2/torrents/info`, {
        params: { hashes: hash },
        headers: { Cookie: sid },
      });

      if (!res.data || res.data.length === 0) {
        return {
          status: "error",
          progress: "0.0",
          speed: "0.00",
          total: "0.00",
          completed: "0.00",
          dir: "",
          name: "",
          error: "Torrent not found",
        } as TorrentStatus;
      }

      const t: QBitTorrent = res.data[0];

      let status: DownloadStatus = "active";
      if (t.progress >= 1) status = "complete";
      if (t.state.includes("paused") || t.state.includes("stalled"))
        status = "waiting";
      if (t.state.includes("error")) status = "error";

      return {
        status: status,
        progress: (t.progress * 100).toFixed(1),
        speed: (t.dlspeed / 1024 / 1024).toFixed(2),
        total: (t.size / 1024 / 1024).toFixed(2),
        completed: ((t.size * t.progress) / 1024 / 1024).toFixed(2),
        dir: t.save_path,
        name: t.name,
      };
    } catch (error: any) {
      if (error.response?.status === 403) {
        this.sid = null;
        return this.getTorrentStatus(hash);
      }
      return {
        status: "error",
        error: error.message,
        progress: "0.0",
        speed: "0.00",
        total: "0.00",
        completed: "0.00",
        dir: "",
        name: "",
      };
    }
  }

  /**
   * Get all active (downloading) normalized file paths
   */
  public async getActiveDownloads(): Promise<string[]> {
    try {
      const sid = await this.getAuthCookie();
      const res = await axios.get(
        `${QBIT_URL}/api/v2/torrents/info?filter=downloading`,
        {
          headers: { Cookie: sid },
        },
      );

      const downloadingFiles: string[] = [];

      for (const torrent of res.data as QBitTorrent[]) {
        const filesRes = await axios.get(`${QBIT_URL}/api/v2/torrents/files`, {
          params: { hash: torrent.hash },
          headers: { Cookie: sid },
        });

        if (filesRes.data) {
          for (const file of filesRes.data as QBitFile[]) {
            const fullPath = path
              .join(torrent.save_path, file.name)
              .replace(/\\/g, "/");
            downloadingFiles.push(fullPath);
          }
        }
      }

      return downloadingFiles;
    } catch (error: any) {
      if (error.response?.status === 403) {
        this.sid = null;
        return this.getActiveDownloads();
      }
      console.error("[qBit] Error getting active downloads:", error.message);
      return [];
    }
  }
}

// Export singleton instance
export const downloaderService = new DownloaderService();
