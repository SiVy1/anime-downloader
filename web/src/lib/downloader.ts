import axios from "axios";
import path from "path";

const ARIA2_URL = process.env.ARIA2_URL || "http://localhost:6800/jsonrpc";
const ARIA2_SECRET = process.env.ARIA2_SECRET || "TWOJE_HASLO";
export const ARIA2_PATH = process.env.ARIA2_PATH || "";

const NYAA_API = "https://nyaaapi.onrender.com/nyaa";

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

    let results = response.data.data || [];

    // Dodaj wykrywanie rozszerzenia i meta-informacji
    results = results.map((item: any) => {
      const title = item.title;
      const extMatch =
        title.match(/\.(mkv|mp4|avi|mov)\b/i) ||
        title.match(/\[(mkv|mp4|avi|mov)\]/i);
      const extension = extMatch ? extMatch[1].toLowerCase() : "unknown";

      return {
        ...item,
        extension,
        isHevc:
          title.toLowerCase().includes("hevc") ||
          title.toLowerCase().includes("h.265") ||
          title.toLowerCase().includes("x265"),
      };
    });

    // Sortowanie: SubsPlease i Erai-raws na górę (zachowujemy priorytet grup)
    return results.sort((a: any, b: any) => {
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

      // Jeśli oba mają ten sam priorytet, sortujemy według parametru sortBy, jeśli nie jest to seeders (bo to już zrobiło API)
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
  } catch (error: any) {
    console.error("Błąd podczas odpytywania Nyaa API:", error.message);
    return [];
  }
}

export async function addToAria2(
  magnetLinks: string[],
  subfolder: string = "",
) {
  const targetDir = path.join(ARIA2_PATH, subfolder).replace(/\\/g, "/");
  const gids: string[] = [];

  try {
    for (const magnet of magnetLinks) {
      const jsonReq = {
        jsonrpc: "2.0",
        id: "anime-downloader",
        method: "aria2.addUri",
        params: [`token:${ARIA2_SECRET}`, [magnet], { dir: targetDir }],
      };
      const res = await axios.post(ARIA2_URL, jsonReq);
      if (res.data.error) {
        console.error("Błąd Aria2:", res.data.error.message);
        return null;
      }
      gids.push(res.data.result);
    }
    return gids;
  } catch (error: any) {
    console.error("Błąd podczas połączenia z Aria2:", error.message);
    return null;
  }
}

export async function getAria2Status(gid: string) {
  try {
    const jsonReq = {
      jsonrpc: "2.0",
      id: "status",
      method: "aria2.tellStatus",
      params: [`token:${ARIA2_SECRET}`, gid],
    };
    const response = await axios.post(ARIA2_URL, jsonReq);
    if (response.data.error) {
      return { error: response.data.error.message };
    }

    const s = response.data.result;
    const progress =
      s.totalLength > 0
        ? ((s.completedLength / s.totalLength) * 100).toFixed(1)
        : "0";
    const downloadSpeed = (s.downloadSpeed / 1024 / 1024).toFixed(2); // MB/s

    return {
      status: s.status, // active, waiting, paused, error, complete
      progress: progress,
      speed: downloadSpeed,
      total: (s.totalLength / 1024 / 1024).toFixed(2),
      completed: (s.completedLength / 1024 / 1024).toFixed(2),
      dir: s.dir,
      files: s.files,
    };
  } catch (error: any) {
    return { error: error.message };
  }
}
