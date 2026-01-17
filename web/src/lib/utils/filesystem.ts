/**
 * Filesystem Utilities
 *
 * Common file system operations used across the application.
 * Optimized for performance using asynchronous I/O.
 */

import fs from "fs";
import { promises as fsp } from "fs";
import path from "path";

/**
 * Recursively get all files in a directory (Asynchronous)
 *
 * @param dir - Directory path to scan
 * @param fileList - Accumulator for found files (used in recursion)
 * @returns Promise resolving to an array of absolute file paths
 */
export async function getAllFiles(
  dir: string,
  fileList: string[] = [],
): Promise<string[]> {
  try {
    const stats = await fsp.stat(dir);
    if (!stats.isDirectory()) return fileList;
  } catch (err) {
    return fileList;
  }

  const files = await fsp.readdir(dir, { withFileTypes: true });

  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dir, file.name);
      if (file.isDirectory()) {
        await getAllFiles(filePath, fileList);
      } else {
        fileList.push(filePath);
      }
    }),
  );

  return fileList;
}

/**
 * Get all video files in a directory (recursive, Asynchronous)
 *
 * @param dir - Directory path to scan
 * @returns Promise resolving to an array of relative paths to video files
 */
export async function getVideoFiles(dir: string): Promise<string[]> {
  const VIDEO_EXTENSIONS = [".mkv", ".mp4", ".avi", ".mov"];
  const allFiles = await getAllFiles(dir);

  return allFiles
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return VIDEO_EXTENSIONS.includes(ext);
    })
    .map((file) => path.relative(dir, file).replace(/\\/g, "/"))
    .sort();
}

/**
 * Check if a file exists (Asynchronous)
 */
export async function exists(filePath: string): Promise<boolean> {
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalize a file path to use forward slashes
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}
