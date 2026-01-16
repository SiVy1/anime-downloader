import axios from "axios";
import path from "path";

const ARIA2_URL = process.env.ARIA2_URL || "http://localhost:6800/jsonrpc";
const ARIA2_SECRET = process.env.ARIA2_SECRET || "TWOJE_HASLO";
export const ARIA2_PATH = process.env.ARIA2_PATH || "";

const NYAA_API = "https://nyaaapi.onrender.com/nyaa";

export async function searchNyaa(query: string) {
  try {
    const response = await axios.get(NYAA_API, {
      params: {
        q: `${query} 1080p`,
        category: "anime",
        sub_category: "eng",
        sort: "seeders",
      },
      timeout: 10000,
    });

    const results = response.data.data || [];

    // Sortowanie: SubsPlease i Erai-raws na górę
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
      return 0; // Jeśli oba mają priorytet lub oba nie mają, zostaw kolejność (według seeders z API)
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
