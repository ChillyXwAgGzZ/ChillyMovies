import { describe, it, expect } from "vitest";
import { TMDBMetadataFetcher } from "../src/metadata";
import { config } from "dotenv";

// Load environment variables
config();

describe("TMDBMetadataFetcher - Live API Integration", () => {
  // Skip these tests if TMDB_API_KEY is not set
  const shouldSkip = !process.env.TMDB_API_KEY || process.env.TMDB_API_KEY === "";

  it.skipIf(shouldSkip)("should fetch movie details by TMDB ID", async () => {
    const fetcher = new TMDBMetadataFetcher({ enableCache: false }); // Disable cache for integration tests
    
    // The Matrix (1999) - TMDB ID: 603
    const result = await fetcher.fetchByTMDBId(603, "movie");
    
    expect(result).not.toBeNull();
    expect(result!.id).toBe(603);
    expect(result!.title).toBe("The Matrix");
    expect(result!.year).toBe(1999);
    expect(result!.overview).toBeTruthy();
    expect(result!.poster).toContain("https://image.tmdb.org/t/p/w500");
    expect(result!.mediaType).toBe("movie");
  }, { timeout: 10000 });

  it.skipIf(shouldSkip)("should search for movies by title", async () => {
    const fetcher = new TMDBMetadataFetcher({ enableCache: false });
    
    const results = await fetcher.searchByTitle("Inception");
    
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThan(0);
    
    const inception = results.find(r => r.title === "Inception");
    expect(inception).toBeTruthy();
    expect(inception!.year).toBe(2010);
    expect(inception!.overview).toBeTruthy();
  }, { timeout: 10000 });

  it.skipIf(shouldSkip)("should fetch TV show details by TMDB ID", async () => {
    const fetcher = new TMDBMetadataFetcher({ enableCache: false });
    
    // Breaking Bad - TMDB ID: 1396
    const result = await fetcher.fetchByTMDBId(1396, "tv");
    
    expect(result).not.toBeNull();
    expect(result!.id).toBe(1396);
    expect(result!.title).toBe("Breaking Bad");
    expect(result!.year).toBe(2008);
    expect(result!.mediaType).toBe("tv");
  }, { timeout: 10000 });

  it.skipIf(shouldSkip)("should return null for non-existent TMDB ID", async () => {
    const fetcher = new TMDBMetadataFetcher();
    
    // Use a very unlikely ID
    const result = await fetcher.fetchByTMDBId(999999999, "movie");
    
    expect(result).toBeNull();
  }, { timeout: 10000 });

  it.skipIf(shouldSkip)("should handle rate limiting gracefully with retries", async () => {
    const fetcher = new TMDBMetadataFetcher();
    
    // Make multiple rapid requests to test retry logic
    const requests = [
      fetcher.searchByTitle("Action"),
      fetcher.searchByTitle("Comedy"),
      fetcher.searchByTitle("Drama"),
    ];
    
    const results = await Promise.all(requests);
    
    expect(results).toHaveLength(3);
    results.forEach(result => {
      expect(result).toBeInstanceOf(Array);
    });
  }, { timeout: 30000 });

  it("should throw error when API key is not configured", async () => {
    const fetcher = new TMDBMetadataFetcher({ apiKey: "", enableCache: false }); // Empty API key, no cache
    
    await expect(fetcher.fetchByTMDBId(603, "movie")).rejects.toThrow("TMDB API key not configured");
    await expect(fetcher.searchByTitle("Inception")).rejects.toThrow("TMDB API key not configured");
  });
});
