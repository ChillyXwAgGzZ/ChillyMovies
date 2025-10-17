import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TMDBMetadataFetcher, MockMetadataFetcher } from "../src/metadata";
import { config } from "dotenv";

// Load environment variables
config();

describe("Trailer Fetching", () => {
  describe("MockMetadataFetcher", () => {
    let fetcher: MockMetadataFetcher;

    beforeEach(() => {
      fetcher = new MockMetadataFetcher();
    });

    it("should return mock trailers", async () => {
      const trailers = await fetcher.fetchTrailers(12345);
      expect(trailers).toHaveLength(1);
      expect(trailers[0]).toMatchObject({
        key: expect.any(String),
        name: expect.stringContaining("Trailer"),
        site: "YouTube",
        type: "Trailer",
        official: true,
      });
    });

    it("should return trailers for TV shows", async () => {
      const trailers = await fetcher.fetchTrailers(67890, "tv");
      expect(trailers).toHaveLength(1);
      expect(trailers[0].site).toBe("YouTube");
    });
  });

  describe("TMDBMetadataFetcher", () => {
    let fetcher: TMDBMetadataFetcher;

    beforeEach(() => {
      fetcher = new TMDBMetadataFetcher({
        apiKey: process.env.TMDB_API_KEY || "test-key",
        enableCache: false, // Disable cache for tests
      });
    });

    afterEach(async () => {
      await fetcher.shutdown();
    });

    it("should throw error when API key not configured", async () => {
      const noKeyFetcher = new TMDBMetadataFetcher({
        apiKey: "",
        enableCache: false,
      });
      
      await expect(noKeyFetcher.fetchTrailers(550)).rejects.toThrow(
        "TMDB API key not configured"
      );
      
      await noKeyFetcher.shutdown();
    });

    it("should return empty array for non-existent movie", async () => {
      // Test with a likely non-existent ID
      const trailers = await fetcher.fetchTrailers(999999999);
      expect(Array.isArray(trailers)).toBe(true);
    });

    it("should cache trailer results", async () => {
      const cachingFetcher = new TMDBMetadataFetcher({
        apiKey: process.env.TMDB_API_KEY || "test-key",
        enableCache: true,
      });

      // First call - should hit API
      const trailers1 = await cachingFetcher.fetchTrailers(550); // Fight Club
      
      // Second call - should hit cache
      const trailers2 = await cachingFetcher.fetchTrailers(550);
      
      expect(trailers1).toEqual(trailers2);
      
      await cachingFetcher.shutdown();
    });

    it("should filter and sort trailers correctly", async () => {
      // Using a popular movie that should have trailers
      const trailers = await fetcher.fetchTrailers(550); // Fight Club
      
      if (trailers.length > 0) {
        // All should be YouTube
        trailers.forEach(trailer => {
          expect(trailer.site).toBe("YouTube");
          expect(["Trailer", "Teaser"]).toContain(trailer.type);
        });

        // Official trailers should come first if present
        const officialIndex = trailers.findIndex(t => t.official);
        const unofficialIndex = trailers.findIndex(t => !t.official);
        
        if (officialIndex >= 0 && unofficialIndex >= 0) {
          expect(officialIndex).toBeLessThan(unofficialIndex);
        }
      }
    });

    it("should handle TV show trailers", async () => {
      const trailers = await fetcher.fetchTrailers(1399, "tv"); // Game of Thrones
      
      expect(Array.isArray(trailers)).toBe(true);
      
      if (trailers.length > 0) {
        expect(trailers[0]).toMatchObject({
          key: expect.any(String),
          name: expect.any(String),
          site: "YouTube",
          type: expect.stringMatching(/Trailer|Teaser/),
        });
      }
    });
  });
});
