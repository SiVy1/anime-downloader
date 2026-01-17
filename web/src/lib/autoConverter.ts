import fs from "fs";
import path from "path";
import { ARIA2_PATH } from "./downloader";
import {
  convertMkvToMp4,
  hasConvertedVersion,
  getMp4Path,
} from "./conversionService";

/**
 * AutoConverter - Background service that monitors for new MKV files
 */
class AutoConverter {
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;
  private queue: string[] = [];

  /**
   * Start the monitoring loop
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("[AUTO-CONVERT] Service started monitoring:", ARIA2_PATH);

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
    if (!ARIA2_PATH || !fs.existsSync(ARIA2_PATH)) return;

    try {
      const folders = fs.readdirSync(ARIA2_PATH);

      for (const folder of folders) {
        const folderPath = path.join(ARIA2_PATH, folder);
        if (!fs.statSync(folderPath).isDirectory()) continue;

        const files = this.getAllFiles(folderPath);
        const mkvFiles = files.filter((f) => f.toLowerCase().endsWith(".mkv"));

        for (const mkvPath of mkvFiles) {
          const relativePath = path.relative(ARIA2_PATH, mkvPath);

          // Check if already converted or in queue
          if (
            !hasConvertedVersion(mkvPath) &&
            !this.queue.includes(relativePath)
          ) {
            console.log(`[AUTO-CONVERT] Found new MKV: ${relativePath}`);
            this.addToQueue(relativePath);
          }
        }
      }
    } catch (err) {
      console.error("[AUTO-CONVERT] Scan error:", err);
    }
  }

  /**
   * Recursively get all files in a directory
   */
  private getAllFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const name = path.join(dir, file);
      if (fs.statSync(name).isDirectory()) {
        this.getAllFiles(name, fileList);
      } else {
        fileList.push(name);
      }
    });
    return fileList;
  }

  /**
   * Add a file to the conversion queue
   */
  private async addToQueue(relativePath: string) {
    this.queue.push(relativePath);

    // Start conversion in the background
    convertMkvToMp4(relativePath)
      .then((result) => {
        if (result.success) {
          console.log(`[AUTO-CONVERT] Successfully converted: ${relativePath}`);
        } else {
          console.error(
            `[AUTO-CONVERT] Failed to convert ${relativePath}:`,
            result.error,
          );
        }
      })
      .finally(() => {
        // Remove from queue
        this.queue = this.queue.filter((q) => q !== relativePath);
      });
  }
}

// Export as singleton
export const autoConverter = new AutoConverter();
