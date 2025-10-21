/**
 * Integration test for Movie Detail API
 * Tests fetching movie details from TMDB API
 */

import { describe, it, expect, beforeAll } from "vitest";
import { metadataApi, ApiError } from "../../src/renderer/services/api";

describe("Movie Detail API Integration", () => {
  // Use a well-known movie ID (Fight Club - 550)
  const FIGHT_CLUB_ID = 550;
  const INVALID_MOVIE_ID = 999999999;

  beforeAll(() => {
    // Ensure API base URL is set
    if (!import.meta.env.VITE_API_BASE_URL) {
      console.warn("VITE_API_BASE_URL not set, using default http://localhost:3000");
    }
  });

  it("should fetch movie details successfully", async () => {
    const movie = await metadataApi.getDetails(FIGHT_CLUB_ID, "movie");

    // Verify response structure
    expect(movie).toBeDefined();
    expect(movie.id).toBe(FIGHT_CLUB_ID);
    expect(movie.title).toBe("Fight Club");
    expect(movie.year).toBe(1999);
    expect(movie.overview).toBeDefined();
    expect(movie.overview).not.toBe("");
    expect(movie.poster).toBeDefined();
    expect(movie.poster).toContain("https://image.tmdb.org");
    expect(movie.backdrop).toBeDefined();
    expect(movie.voteAverage).toBeGreaterThan(0);
    expect(movie.releaseDate).toBe("1999-10-15");
    expect(movie.mediaType).toBe("movie");
  });

  it("should fetch movie trailers successfully", async () => {
    const trailers = await metadataApi.getTrailers(FIGHT_CLUB_ID, "movie");

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

  it("should handle invalid movie ID gracefully", async () => {
    await expect(
      metadataApi.getDetails(INVALID_MOVIE_ID, "movie")
    ).rejects.toThrow(ApiError);

    try {
      await metadataApi.getDetails(INVALID_MOVIE_ID, "movie");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.errorType).toBe("not-found");
        expect(error.status).toBe(404);
        expect(error.isRetryable).toBe(false);
      }
    }
  });

  it("should categorize error types correctly", async () => {
    try {
      await metadataApi.getDetails(INVALID_MOVIE_ID, "movie");
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
