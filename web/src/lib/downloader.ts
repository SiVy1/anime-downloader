import axios from "axios";
import path from "path";
import { NyaaRawEntry, NyaaSearchResult } from "./types/nyaa";

const QBIT_URL = process.env.QBIT_URL || "http://localhost:8080";
const QBIT_USER = process.env.QBIT_USER || "admin";
const QBIT_PASS = process.env.QBIT_PASS || "adminadmin";
export const ARIA2_PATH = process.env.ARIA2_PATH || "";

const NYAA_API = "https://nyaaapi.onrender.com/nyaa";

// Helper to extract info hash from magnet link
function getHashFromMagnet(magnet: string): string | null {
  const match = magnet.match(/xt=urn:btih:([a-z0-9]+)/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * qBittorrent Authentication
 */
async function qbitLogin() {
  const params = new URLSearchParams();
  params.append("username", QBIT_USER);
  params.append("password", QBIT_PASS);

  const res = await axios.post(`${QBIT_URL}/api/v2/auth/login`, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  // Extract SID from cookie
  const cookie = res.headers["set-cookie"];
  return cookie ? cookie[0].split(";")[0] : "";
}

export async function searchNyaa(
  query: string,
  sortBy: string = "seeders",
  order: string = "desc",
) {
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

    // Sort: SubsPlease and Erai-raws to top (preserve group priority)
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

      // If both have same priority, sort by sortBy param (unless seeders - already sorted by API)
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
    console.error("[Nyaa] Error querying Nyaa API:", error);
    return [];
  }
}

/**
 * Add torrent to qBittorrent
 */
export async function addToQBit(magnetLinks: string[], subfolder: string = "") {
  const targetDir = path.join(ARIA2_PATH, subfolder).replace(/\\/g, "/");
  const hashes: string[] = [];

  try {
    const sid = await qbitLogin();

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

      const hash = getHashFromMagnet(magnet);
      if (hash) hashes.push(hash);
    }
    return hashes;
  } catch (error) {
    console.error("[qBit] Error connecting to qBittorrent:", error);
    return null;
  }
}

/**
 * Get qBittorrent status for a hash
 */
export async function getQBitStatus(hash: string) {
  try {
    const sid = await qbitLogin();
    const res = await axios.get(`${QBIT_URL}/api/v2/torrents/info`, {
      params: { hashes: hash },
      headers: { Cookie: sid },
    });

    if (!res.data || res.data.length === 0) {
      return { error: "Torrent not found" };
    }

    const t = res.data[0];

    // Map qBittorrent status to our format
    // statuses: downloading, seeding, stalledDL, stalledUP, metaDL, pausedDL, completed, error
    let status = "active";
    if (t.progress >= 1) status = "complete";
    if (t.state.includes("paused") || t.state.includes("stalled"))
      status = "waiting";
    if (t.state.includes("error")) status = "error";

    return {
      status: status,
      progress: (t.progress * 100).toFixed(1),
      speed: (t.dlspeed / 1024 / 1024).toFixed(2), // MB/s
      total: (t.size / 1024 / 1024).toFixed(2),
      completed: ((t.size * t.progress) / 1024 / 1024).toFixed(2),
      dir: t.save_path,
      name: t.name,
    };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Get all files currently being downloaded by qBittorrent
 */
export async function getAllDownloadingFiles(): Promise<string[]> {
  try {
    const sid = await qbitLogin();
    // Get all torrents that are not finished
    const res = await axios.get(
      `${QBIT_URL}/api/v2/torrents/info?filter=downloading`,
      {
        headers: { Cookie: sid },
      },
    );

    let downloadingFiles: string[] = [];

    for (const torrent of res.data) {
      const filesRes = await axios.get(`${QBIT_URL}/api/v2/torrents/files`, {
        params: { hash: torrent.hash },
        headers: { Cookie: sid },
      });

      if (filesRes.data) {
        for (const file of filesRes.data) {
          // Add absolute normalized path to the list
          const fullPath = path
            .join(torrent.save_path, file.name)
            .replace(/\\/g, "/");
          downloadingFiles.push(fullPath);
        }
      }
    }

    return downloadingFiles;
  } catch (error) {
    console.error("[QBIT] Error getting downloading files:", error);
    return [];
  }
}

// Keep Aria2 functions as helpers if needed for transitional period
export const addToAria2 = addToQBit;
export const getAria2Status = getQBitStatus;
