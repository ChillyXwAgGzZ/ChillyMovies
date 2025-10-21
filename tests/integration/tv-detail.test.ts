/**
 * Integration test for TV Detail API
 * Tests fetching TV show details and seasons from TMDB API
 */

import { describe, it, expect, beforeAll } from "vitest";
import { metadataApi, ApiError } from "../../src/renderer/services/api";

describe("TV Detail API Integration", () => {
  // Use a well-known TV show ID (Breaking Bad - 1396)
  const BREAKING_BAD_ID = 1396;
  const INVALID_TV_ID = 999999999;

  beforeAll(() => {
    // Ensure API base URL is set
    if (!import.meta.env.VITE_API_BASE_URL) {
      console.warn("VITE_API_BASE_URL not set, using default http://localhost:3000");
    }
  });

  it("should fetch TV show details successfully", async () => {
    const series = await metadataApi.getDetails(BREAKING_BAD_ID, "tv");

    // Verify response structure
    expect(series).toBeDefined();
    expect(series.id).toBe(BREAKING_BAD_ID);
    expect(series.title).toBe("Breaking Bad");
    expect(series.year).toBe(2008);
    expect(series.overview).toBeDefined();
    expect(series.overview).not.toBe("");
    expect(series.poster).toBeDefined();
    expect(series.poster).toContain("https://image.tmdb.org");
    expect(series.backdrop).toBeDefined();
    expect(series.voteAverage).toBeGreaterThan(0);
    expect(series.releaseDate).toBe("2008-01-20");
    expect(series.mediaType).toBe("tv");
  });

  it("should fetch TV show seasons successfully", async () => {
    const seasons = await metadataApi.getTVSeasons(BREAKING_BAD_ID);

    // Verify seasons structure
    expect(Array.isArray(seasons)).toBe(true);
    expect(seasons.length).toBeGreaterThan(0);

    const firstSeason = seasons[0];
    expect(firstSeason.id).toBeDefined();
    expect(firstSeason.name).toBeDefined();
    expect(firstSeason.seasonNumber).toBeDefined();
    expect(firstSeason.episodeCount).toBeGreaterThan(0);
  });

  it("should fetch TV season details with episodes", async () => {
    // Fetch season 1 of Breaking Bad
    const season = await metadataApi.getTVSeasonDetails(BREAKING_BAD_ID, 1);

    // Verify season structure
    expect(season).toBeDefined();
    expect(season.id).toBeDefined();
    expect(season.name).toBeDefined();
    expect(season.seasonNumber).toBe(1);
    expect(season.episodeCount).toBeGreaterThan(0);

    // Verify episodes
    if (season.episodes) {
      expect(Array.isArray(season.episodes)).toBe(true);
      expect(season.episodes.length).toBeGreaterThan(0);

      const firstEpisode = season.episodes[0];
      expect(firstEpisode.id).toBeDefined();
      expect(firstEpisode.name).toBeDefined();
      expect(firstEpisode.episodeNumber).toBe(1);
      expect(firstEpisode.seasonNumber).toBe(1);
    }
  });

  it("should fetch TV show trailers successfully", async () => {
    const trailers = await metadataApi.getTrailers(BREAKING_BAD_ID, "tv");

    // Verify trailers structure
    expect(Array.isArray(trailers)).toBe(true);
    
    if (trailers.length > 0) {
      const trailer = trailers[0];
      expect(trailer.id).toBeDefined();
      expect(trailer.key).toBeDefined();
      expect(trailer.name).toBeDefined();
      expect(trailer.site).toBeDefined();
      expect(trailer.type).toBeDefined();
    }
  });

  it("should handle invalid TV show ID gracefully", async () => {
    await expect(
      metadataApi.getDetails(INVALID_TV_ID, "tv")
    ).rejects.toThrow(ApiError);

    try {
      await metadataApi.getDetails(INVALID_TV_ID, "tv");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.errorType).toBe("not-found");
        expect(error.status).toBe(404);
        expect(error.isRetryable).toBe(false);
      }
    }
  });

  it("should handle invalid season number gracefully", async () => {
    const invalidSeasonNumber = 999;

    await expect(
      metadataApi.getTVSeasonDetails(BREAKING_BAD_ID, invalidSeasonNumber)
    ).rejects.toThrow(ApiError);

    try {
      await metadataApi.getTVSeasonDetails(BREAKING_BAD_ID, invalidSeasonNumber);
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.errorType).toBe("not-found");
        expect(error.isRetryable).toBe(false);
      }
    }
  });

  it("should categorize error types correctly", async () => {
    try {
      await metadataApi.getDetails(INVALID_TV_ID, "tv");
    } catch (error) {
      if (error instanceof ApiError) {
        const userMessage = error.getUserMessage();
        expect(userMessage).toBeDefined();
        expect(typeof userMessage).toBe("string");
        expect(userMessage.length).toBeGreaterThan(0);
      }
    }
  });
});
