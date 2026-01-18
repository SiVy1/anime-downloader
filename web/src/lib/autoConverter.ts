import { promises as fsp } from "fs";
import path from "path";
import { ARIA2_PATH, downloaderService } from "./downloader";
import { hasConvertedVersion } from "./conversionService";
import { getAllFiles, exists } from "./utils/filesystem";
import { addConversionJob } from "./queueService";
import { initConversionWorker } from "./workers/conversionWorker";


/**
 * AutoConverter - Background service that monitors for new MKV files (Asynchronous)
 */
class AutoConverter {
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;
  private workerInitialized = false;

  /**
   * Start the monitoring loop
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("[AUTO-CONVERT] Service started monitoring:", ARIA2_PATH);

    // Initialize worker if not already done
    if (!this.workerInitialized) {
      initConversionWorker();
      this.workerInitialized = true;
    }

    // Initial scan and then every 30 seconds
    this.scan();
    this.interval = setInterval(() => this.scan(), 30000);
  }

  /**
   * Stop the monitoring loop
   */
  stop() {
    if (this.interval) clearInterval(this.interval);
    this.isRunning = false;
  }

  /**
   * Scan the anime directory for MKV files that need conversion
   */
  async scan() {
    if (!ARIA2_PATH || !(await exists(ARIA2_PATH))) return;

    try {
      // Get list of currently downloading files from qBittorrent
      const downloadingFiles = await downloaderService.getActiveDownloads();
      const folders = await fsp.readdir(ARIA2_PATH);

      for (const folder of folders) {
        const folderPath = path.join(ARIA2_PATH, folder);
        const stats = await fsp.stat(folderPath).catch(() => null);

        if (!stats || !stats.isDirectory()) continue;

        const files = await getAllFiles(folderPath);
        const mkvFiles = files.filter((f) => f.toLowerCase().endsWith(".mkv"));

        for (const mkvPath of mkvFiles) {
          const normalizedPath = mkvPath.replace(/\\/g, "/");
          const relativePath = path.relative(ARIA2_PATH, mkvPath);

          // Skip if qBittorrent says it's still downloading
          if (downloadingFiles.includes(normalizedPath)) {
            continue;
          }

          // Skip qBittorrent temporary files
          if (mkvPath.endsWith(".!qB")) {
            continue;
          }

          // Check if already converted
          if (!(await hasConvertedVersion(mkvPath))) {
            console.log(`[AUTO-CONVERT] Scheduling job for MKV: ${relativePath}`);
            this.addToQueue(relativePath);
          }
        }
      }
    } catch (err) {
      console.error("[AUTO-CONVERT] Scan error:", err);
    }
  }

  /**
   * Add a file to the conversion queue (BullMQ)
   */
  private async addToQueue(relativePath: string) {
    try {
      await addConversionJob(relativePath);
    } catch (err: any) {
      console.error(`[AUTO-CONVERT] Failed to add job to BullMQ:`, err.message);
    }
  }
}


// Export as singleton using global to prevent multiple instances during HMR
const globalAutoConverter = global as unknown as {
  autoConverter: AutoConverter | undefined;
};

export const autoConverter =
  globalAutoConverter.autoConverter || new AutoConverter();

if (process.env.NODE_ENV !== "production") {
  globalAutoConverter.autoConverter = autoConverter;
}

