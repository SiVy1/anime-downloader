import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getAllFiles,
  getVideoFiles,
  normalizePath,
} from "@/lib/utils/filesystem";
import fs from "fs";
import path from "path";
import os from "os";

describe("normalizePath", () => {
  it("should replace backslashes with forward slashes", () => {
    expect(normalizePath("C:\\Users\\test\\file.ts")).toBe(
      "C:/Users/test/file.ts",
    );
  });

  it("should not change already normalized paths", () => {
    expect(normalizePath("path/to/file.ts")).toBe("path/to/file.ts");
  });
});

describe("getAllFiles", () => {
  const tempDir = path.join(os.tmpdir(), "vitest-fs-test-" + Date.now());

  beforeAll(() => {
    // Create test directory structure
    fs.mkdirSync(path.join(tempDir, "subdir"), { recursive: true });
    fs.writeFileSync(path.join(tempDir, "file1.txt"), "test");
    fs.writeFileSync(path.join(tempDir, "file2.mkv"), "video");
    fs.writeFileSync(path.join(tempDir, "subdir", "file3.mp4"), "video2");
  });

  afterAll(() => {
    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should return all files recursively", () => {
    const files = getAllFiles(tempDir);
    expect(files).toHaveLength(3);
    expect(files.some((f) => f.includes("file1.txt"))).toBe(true);
    expect(files.some((f) => f.includes("file2.mkv"))).toBe(true);
    expect(files.some((f) => f.includes("file3.mp4"))).toBe(true);
  });

  it("should return empty array for non-existent directory", () => {
    const files = getAllFiles("/non-existent-path-12345");
    expect(files).toEqual([]);
  });
});

describe("getVideoFiles", () => {
  const tempDir = path.join(os.tmpdir(), "vitest-video-test-" + Date.now());

  beforeAll(() => {
    fs.mkdirSync(path.join(tempDir, "subdir"), { recursive: true });
    fs.writeFileSync(path.join(tempDir, "episode1.mkv"), "video");
    fs.writeFileSync(path.join(tempDir, "episode2.mp4"), "video");
    fs.writeFileSync(path.join(tempDir, "readme.txt"), "text");
    fs.writeFileSync(path.join(tempDir, "subdir", "episode3.avi"), "video");
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should return only video files", () => {
    const videos = getVideoFiles(tempDir);
    expect(videos).toHaveLength(3);
    expect(videos.every((f) => /\.(mkv|mp4|avi|mov)$/i.test(f))).toBe(true);
  });

  it("should return relative paths with forward slashes", () => {
    const videos = getVideoFiles(tempDir);
    expect(videos.some((f) => f.includes("subdir/episode3.avi"))).toBe(true);
    expect(videos.every((f) => !f.includes("\\"))).toBe(true);
  });

  it("should return files sorted alphabetically", () => {
    const videos = getVideoFiles(tempDir);
    const sorted = [...videos].sort();
    expect(videos).toEqual(sorted);
  });
});
