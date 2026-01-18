import axios from "axios";
import path from "path";
import env from "./env";
import { NyaaRawEntry, NyaaSearchResult } from "./types/nyaa";
import {
  QBitTorrent,
  QBitFile,
  TorrentStatus,
  DownloadStatus,
} from "./types/qbittorrent";

// Using central config from env.ts
const {
  qbitUrl: QBIT_URL,
  qbitUser: QBIT_USER,
  qbitPass: QBIT_PASS,
  aria2Path: ARIA2_PATH,
} = env.downloader;
export { ARIA2_PATH };

const NYAA_API = "https://nyaaapi.onrender.com/nyaa";

/**
 * DownloaderService - Singleton Service for Torrent Management
 */
class DownloaderService {
  private sid: string | null = null;

  /**
   * Get or refresh qBittorrent SID
   */
  private async getAuthCookie(forceRefresh = false): Promise<string> {
    if (this.sid && !forceRefresh) return this.sid;

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
      console.log(`[Nyaa] Searching: ${query}`);

      const response = await axios.get(NYAA_API, {
        params: {
          q: query,
          category: "anime",
          sub_category: "eng",
          sort: sortBy,
          order: order,
        },
        timeout: 15000,
      });

      const rawResults: NyaaRawEntry[] = response.data.data || [];

      const results: NyaaSearchResult[] = rawResults.map((item) => {
        const title = item.title.toLowerCase();
        const magnet = item.magnet || "";
        const hash = this.getHashFromMagnet(magnet) || `temp-${Math.random()}`;

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
          id: hash,
          hash: hash,
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
        return 0;
      });
    } catch (error) {
      console.error("[Nyaa] Search error:", error);
      return [];
    }
  }

  /**
   * Search AnimeTosho for anime torrents
   */
  public async searchAnimeTosho(query: string): Promise<NyaaSearchResult[]> {
    const ANIMETOSHO_API = "https://feed.animetosho.org/json";

    try {
      console.log(`[AnimeTosho] Searching: ${query}`);

      const response = await axios.get(ANIMETOSHO_API, {
        params: {
          q: query,
          only_tor: 1,
        },
        timeout: 15000,
      });

      const rawResults: any[] = response.data || [];

      const results: NyaaSearchResult[] = rawResults.map((item) => {
        const title = item.title?.toLowerCase() || "";
        const hash = item.info_hash || `temp-${Math.random()}`;

        const extMatch =
          title.match(/\.(mkv|mp4|avi|mov)\b/i) ||
          title.match(/\[(mkv|mp4|avi|mov)\]/i);
        const extension = extMatch ? extMatch[1].toLowerCase() : "unknown";

        const isHevc =
          title.includes("hevc") ||
          title.includes("h265") ||
          title.includes("h.265") ||
          title.includes("x265");
        const isAvc =
          title.includes("h264") ||
          title.includes("h.264") ||
          title.includes("x264") ||
          title.includes("avc");

        // Convert total_size to human-readable format
        const sizeBytes = item.total_size || 0;
        const sizeMiB = sizeBytes / (1024 * 1024);
        const sizeGiB = sizeMiB / 1024;
        const sizeStr =
          sizeGiB >= 1
            ? `${sizeGiB.toFixed(2)} GiB`
            : `${sizeMiB.toFixed(0)} MiB`;

        return {
          title: item.title || "",
          link: item.link || "",
          seeders: item.seeders || 0,
          leechers: item.leechers || 0,
          size: sizeStr,
          date: item.timestamp
            ? new Date(item.timestamp * 1000).toISOString()
            : "",
          magnet: item.magnet_uri || "",
          torrent: item.torrent_url || "",
          id: hash,
          hash: hash,
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
        return 0;
      });
    } catch (error) {
      console.error("[AnimeTosho] Search error:", error);
      return [];
    }
  }

  /**
   * Search both Nyaa and AnimeTosho, combine results
   */
  public async searchAll(
    query: string,
    sortBy: string = "seeders",
    order: string = "desc",
  ): Promise<NyaaSearchResult[]> {
    const [nyaaResults, toshoResults] = await Promise.all([
      this.searchNyaa(query, sortBy, order),
      this.searchAnimeTosho(query),
    ]);

    // Combine and deduplicate by hash
    const seen = new Set<string>();
    const combined: NyaaSearchResult[] = [];

    for (const result of [...nyaaResults, ...toshoResults]) {
      if (!seen.has(result.hash)) {
        seen.add(result.hash);
        combined.push(result);
      }
    }

    // Sort combined results: priority groups first, then by seeders
    return combined.sort((a, b) => {
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

      // Secondary sort by seeders
      return b.seeders - a.seeders;
    });
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
        params.append("category", subfolder);
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
