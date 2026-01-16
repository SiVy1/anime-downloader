require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const TeraboxUploader = require("terabox-upload-tool");

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

// Konfiguracja Aria2
const ARIA2_URL = process.env.ARIA2_URL || "http://localhost:6800/jsonrpc";
const ARIA2_SECRET = process.env.ARIA2_SECRET || "TWOJE_HASLO";
const ARIA2_PATH = process.env.ARIA2_PATH || path.resolve(__dirname, "anime");
const NYAA_API = "https://nyaaapi.onrender.com/nyaa";

// Upewnij się, że folder pobierania istnieje
if (!fs.existsSync(ARIA2_PATH)) {
  fs.mkdirSync(ARIA2_PATH, { recursive: true });
}

// Konfiguracja Terabox
const credentials = {
  ndus: process.env.TERABOX_NDUS,
  appId: process.env.TERABOX_APP_ID,
  uploadId: process.env.TERABOX_UPLOAD_ID,
  jsToken: process.env.TERABOX_JS_TOKEN,
  browserId: process.env.TERABOX_BROWSER_ID,
};

let uploader;
try {
  uploader = new TeraboxUploader(credentials);
  console.log("Terabox Uploader initialized");
} catch (err) {
  console.error("Failed to initialize Terabox Uploader:", err.message);
}

// Zbiór GID-ów, które już zostały wysłane lub są w trakcie wysyłania
const processedGids = new Set();

// Funkcja wyszukująca na Nyaa
async function searchNyaa(query) {
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
    return response.data.data || [];
  } catch (error) {
    console.error("Błąd podczas odpytywania Nyaa API:", error.message);
    return [];
  }
}

// Funkcja dodająca do Aria2
async function addToAria2(magnetLinks, subfolder = "") {
  const targetDir = path.join(ARIA2_PATH, subfolder).replace(/\\/g, "/");
  const gids = [];

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
      console.log(`Dodano magnet do Aria2 (GID: ${res.data.result})`);
    }
    return gids;
  } catch (error) {
    console.error("Błąd podczas połączenia z Aria2:", error.message);
    return null;
  }
}

// Endpoint wyszukiwania
app.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Brak zapytania" });

  const results = await searchNyaa(q);
  res.json({ count: results.length, data: results });
});

// Endpoint do pobierania konkretnego magnesu (wybór ręczny)
app.post("/download-magnet", async (req, res) => {
  const { magnet, title } = req.body;
  if (!magnet || !title) return res.status(400).json({ error: "Brak danych" });

  const safeTitle = title.replace(/[^a-z0-9 ._-]/gi, "").trim();
  const gids = await addToAria2([magnet], safeTitle);

  if (!gids) {
    return res.status(500).json({ error: "Błąd podczas dodawania do Aria2" });
  }

  res.json({
    status: "success",
    message: `Dodano torrent do Aria2 (Folder: ${safeTitle})`,
    folder: safeTitle,
    gids: gids,
  });
});

// Endpoint do pobierania (automatyczny wybór)
app.post("/download", async (req, res) => {
  const { title, type } = req.body;
  console.log(`Otrzymano żądanie pobrania: ${title} (${type})`);

  const results = await searchNyaa(title);
  if (!results || results.length === 0) {
    return res
      .status(404)
      .json({ detail: "Nie znaleziono żadnych torrentów na Nyaa.si" });
  }

  let magnetsToAdd = [];
  const preferredGroups = ["SubsPlease", "Erai-raws"];

  if (type === "TV") {
    const batchTorrents = results.filter(
      (t) => t.title.includes("Batch") || t.title.includes("01-"),
    );

    for (const group of preferredGroups) {
      const groupBatches = batchTorrents.filter((t) =>
        t.title.toLowerCase().includes(group.toLowerCase()),
      );
      if (groupBatches.length > 0) {
        magnetsToAdd.push(groupBatches[0].magnet);
        break;
      }
    }

    if (magnetsToAdd.length === 0 && batchTorrents.length > 0) {
      magnetsToAdd.push(batchTorrents[0].magnet);
    }

    if (magnetsToAdd.length === 0) {
      console.log(
        "Nie znaleziono paczki zbiorczej (Batch), szukam pojedynczych odcinków.",
      );
      for (const group of preferredGroups) {
        const groupEps = results.filter((t) =>
          t.title.toLowerCase().includes(group.toLowerCase()),
        );
        if (groupEps.length > 0) {
          magnetsToAdd = groupEps.slice(0, 24).map((t) => t.magnet);
          break;
        }
      }
    }
  } else {
    for (const group of preferredGroups) {
      const groupMovies = results.filter((t) =>
        t.title.toLowerCase().includes(group.toLowerCase()),
      );
      if (groupMovies.length > 0) {
        magnetsToAdd.push(groupMovies[0].magnet);
        break;
      }
    }
    if (magnetsToAdd.length === 0) {
      magnetsToAdd.push(results[0].magnet);
    }
  }

  if (magnetsToAdd.length === 0) {
    return res
      .status(404)
      .json({ detail: "Nie znaleziono odpowiednich torrentów" });
  }

  const safeTitle = title.replace(/[^a-z0-9 ._-]/gi, "").trim();
  const gids = await addToAria2(magnetsToAdd, safeTitle);

  if (!gids) {
    return res.status(500).json({ detail: "Błąd podczas dodawania do Aria2" });
  }

  res.json({
    status: "success",
    message: `Dodano ${magnetsToAdd.length} torrentów do Aria2 (Folder: ${safeTitle})`,
    folder: safeTitle,
    gids: gids,
  });
});

// Endpoint do sprawdzania statusu
app.get("/status/:gid", async (req, res) => {
  const { gid } = req.params;
  try {
    const jsonReq = {
      jsonrpc: "2.0",
      id: "status",
      method: "aria2.tellStatus",
      params: [`token:${ARIA2_SECRET}`, gid],
    };
    const response = await axios.post(ARIA2_URL, jsonReq);
    if (response.data.error) {
      return res.status(404).json({ error: response.data.error.message });
    }

    const s = response.data.result;
    const progress =
      s.totalLength > 0
        ? ((s.completedLength / s.totalLength) * 100).toFixed(1)
        : 0;
    const downloadSpeed = (s.downloadSpeed / 1024 / 1024).toFixed(2); // MB/s

    res.json({
      status: s.status, // active, waiting, paused, error, complete
      progress: progress,
      speed: downloadSpeed,
      total: (s.totalLength / 1024 / 1024).toFixed(2),
      completed: (s.completedLength / 1024 / 1024).toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Opcjonalny endpoint do uploadu na Terabox (wywoływany po zakończeniu pobierania)
app.post("/upload-terabox", async (req, res) => {
  const { folderName, fileName } = req.body;
  if (!uploader)
    return res.status(500).json({ error: "Terabox Uploader not initialized" });

  const localPath = path
    .join(ARIA2_PATH, folderName, fileName)
    .replace(/\\/g, "/");
  const remotePath = `/Anime/${folderName}`;

  try {
    console.log(`Rozpoczynam upload do Terabox: ${localPath} -> ${remotePath}`);
    const result = await uploader.uploadFile(localPath, true, remotePath);

    if (result.success) {
      res.json({ status: "success", details: result.fileDetails });
    } else {
      res.status(500).json({ error: result.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Node.js Backend running on http://0.0.0.0:${PORT}`);
  startAutoUploadMonitor();
});

// Funkcja monitorująca zakończone pobierania w Aria2
async function startAutoUploadMonitor() {
  console.log(`Auto-upload monitor started. Target base path: ${ARIA2_PATH}`);

  setInterval(async () => {
    try {
      const [activeRes, stoppedRes] = await Promise.all([
        axios.post(ARIA2_URL, {
          jsonrpc: "2.0",
          id: "a",
          method: "aria2.tellActive",
          params: [`token:${ARIA2_SECRET}`],
        }),
        axios.post(ARIA2_URL, {
          jsonrpc: "2.0",
          id: "s",
          method: "aria2.tellStopped",
          params: [`token:${ARIA2_SECRET}`, 0, 50],
        }),
      ]);

      const allDownloads = [
        ...(activeRes.data.result || []),
        ...(stoppedRes.data.result || []),
      ];

      for (const download of allDownloads) {
        if (processedGids.has(download.gid)) continue;

        // Zadanie jest gotowe do uploadu, jeśli status to complete LUB pobrano 100% danych (np. przy seedingu)
        const isFinished =
          download.status === "complete" ||
          (download.totalLength > 0 &&
            download.completedLength === download.totalLength);

        if (isFinished) {
          console.log(
            `[MONITOR] Znaleziono gotowe zadanie: ${download.gid} (Status: ${download.status})`,
          );
          const downloadDir = download.dir.replace(/\\/g, "/");

          // Sprawdzamy czy to nie są tylko metadane
          const videoFiles = download.files.filter((f) => {
            const name = path.basename(f.path);
            return (
              !name.includes("[METADATA]") &&
              !name.endsWith(".aria2") &&
              [".mkv", ".mp4", ".avi", ".mp3", ".flac"].some((ext) =>
                f.path.toLowerCase().endsWith(ext),
              )
            );
          });

          if (videoFiles.length === 0) {
            console.log(
              `[MONITOR] Zadanie ${download.gid} to metadane/system. Ignoruję.`,
            );
            processedGids.add(download.gid);
            continue;
          }

          console.log(
            `[MONITOR] Wykryto ukończone wideo: ${download.gid}. Przygotowuję upload.`,
          );
          processedGids.add(download.gid);

          for (const file of videoFiles) {
            let localPath = file.path.replace(/\\/g, "/");
            // Jeśli ścieżka nie jest absolutna, połącz ją z folderem pobierania Arii
            if (!path.isAbsolute(localPath)) {
              localPath = path.join(downloadDir, localPath).replace(/\\/g, "/");
            }

            if (fs.existsSync(localPath)) {
              const relativePath = path
                .relative(ARIA2_PATH, localPath)
                .replace(/\\/g, "/");
              const remoteFolder = "/Anime/" + path.dirname(relativePath);
              autoUploadToTerabox(localPath, remoteFolder, download.gid);
            } else {
              console.warn(
                `[DEBUG] Plik mimo statusu complete nie istnieje: ${localPath}`,
              );
            }
          }
        }
      }
    } catch (err) {
      // Cichy błąd dla połączenia
    }
  }, 15000); // Sprawdzaj co 15 sekund
}

async function autoUploadToTerabox(localPath, remoteFolder, gid) {
  if (!uploader) {
    console.error("[AUTO-UPLOAD] Brak zainicjalizowanego Terabox Uploader!");
    return;
  }

  try {
    console.log(
      `[AUTO-UPLOAD] Rozpoczynam wysyłanie: ${path.basename(localPath)} -> ${remoteFolder}`,
    );
    const result = await uploader.uploadFile(localPath, false, remoteFolder);

    if (result.success) {
      console.log(
        `[AUTO-UPLOAD] Sukces! Plik wysłany na Terabox: ${path.basename(localPath)}`,
      );
    } else {
      console.error(`[AUTO-UPLOAD] Błąd wysyłania: ${result.message}`);
      // Możemy opcjonalnie usunąć z processedGids, żeby spróbował ponownie,
      // ale lepiej uważać na pętle błędów.
    }
  } catch (error) {
    console.error(`[AUTO-UPLOAD] Wyjątek podczas wysyłania: ${error.message}`);
  }
}
