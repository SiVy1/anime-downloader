/**
 * Filesystem Utilities
 *
 * Common file system operations used across the application.
 */

import fs from "fs";
import path from "path";

/**
 * Recursively get all files in a directory
 *
 * @param dir - Directory path to scan
 * @param fileList - Accumulator for found files (used in recursion)
 * @returns Array of absolute file paths
 */
export function getAllFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  return fileList;
}

/**
 * Get all video files in a directory (recursive)
 *
 * @param dir - Directory path to scan
 * @returns Array of relative paths to video files
 */
export function getVideoFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const VIDEO_EXTENSIONS = [".mkv", ".mp4", ".avi", ".mov"];
  const allFiles = getAllFiles(dir);

  return allFiles
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return VIDEO_EXTENSIONS.includes(ext);
    })
    .map((file) => path.relative(dir, file).replace(/\\/g, "/"))
    .sort();
}

/**
 * Normalize a file path to use forward slashes
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}
