import { describe, it, expect } from "vitest";
import { extractEpisodeNumber, parseAnimeFilename } from "@/lib/animeParser";

describe("extractEpisodeNumber", () => {
  it("should extract SubsPlease format: Title - 03", () => {
    expect(
      extractEpisodeNumber("[SubsPlease] One Piece - 1100 (1080p).mkv"),
    ).toBe(1100);
  });

  it("should extract SubsPlease format with version: Title - 03v2", () => {
    expect(extractEpisodeNumber("[SubsPlease] Anime - 05v2 (1080p).mkv")).toBe(
      5,
    );
  });

  it("should extract S01E03 format", () => {
    expect(extractEpisodeNumber("Anime S01E12 1080p.mkv")).toBe(12);
  });

  it("should extract Ep 03 format", () => {
    expect(extractEpisodeNumber("Anime Ep 07 HD.mkv")).toBe(7);
  });

  it("should extract E03 format", () => {
    expect(extractEpisodeNumber("Anime E03.mkv")).toBe(3);
  });

  it("should extract bracketed [03] format", () => {
    expect(extractEpisodeNumber("[Group] Anime [05] [1080p].mkv")).toBe(5);
  });

  it("should return null for files without episode numbers", () => {
    expect(extractEpisodeNumber("Anime Movie 2024.mkv")).toBeNull();
  });

  it("should not match long hashes like [F2DE2719]", () => {
    // This should match the episode "03" not the hash
    expect(extractEpisodeNumber("[SubsPlease] Anime - 03 [F2DE2719].mkv")).toBe(
      3,
    );
  });
});

describe("parseAnimeFilename", () => {
  it("should parse SubsPlease format correctly", async () => {
    const result = await parseAnimeFilename(
      "[SubsPlease] One Piece - 1000 (1080p) [ABCD1234].mkv",
    );
    expect(result.anime_title).toBeTruthy();
    expect(result.episode_number).toBe("1000");
    expect(result.release_group).toBe("SubsPlease");
    // Resolution may be uppercase depending on parser
    expect(result.video_resolution?.toLowerCase()).toBe("1080p");
  });

  it("should handle files without release group", async () => {
    const result = await parseAnimeFilename("Anime Title - 05 (720p).mkv");
    expect(result.anime_title).toBeTruthy();
    expect(result.episode_number).toBe("5");
    expect(result.release_group).toBeNull();
  });

  it("should fallback to regex parser for simple names", async () => {
    const result = await parseAnimeFilename(
      "[Erai-raws] Test Anime - 12 [1080p].mkv",
    );
    expect(result.anime_title).toBeTruthy();
    expect(result.episode_number).toBe("12");
  });
});
