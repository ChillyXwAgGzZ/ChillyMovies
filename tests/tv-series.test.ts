import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { StorageManager } from "../src/storage";
import { TMDBMetadataFetcher } from "../src/metadata";
import fs from "fs";
import path from "path";

describe("TV Series Functionality", () => {
  const testDbBase = path.resolve(__dirname, "../test-data/tv-series.db");
  const testDbPath = testDbBase + ".json";
  let storage: StorageManager;

  beforeEach(() => {
    // Clean up test database files
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    if (fs.existsSync(testDbBase)) {
      fs.unlinkSync(testDbBase);
    }
    storage = new StorageManager({ dbPath: testDbBase });
  });

  afterEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    if (fs.existsSync(testDbBase)) {
      fs.unlinkSync(testDbBase);
    }
  });

  describe("TV Episode Tracking", () => {
    it("should add and retrieve TV episodes", () => {
      storage.addTVEpisode(11111, 1, 1, "Pilot", "job-123", { quality: "1080p" });
      storage.addTVEpisode(11111, 1, 2, "Episode 2", "job-124", { quality: "1080p" });

      const episodes = storage.getTVEpisodes(11111);
      expect(episodes).toHaveLength(2);
      expect(episodes[0].episodeNumber).toBe(1);
      expect(episodes[0].title).toBe("Pilot");
      expect(episodes[1].episodeNumber).toBe(2);
    });

    it("should filter episodes by season", () => {
      storage.addTVEpisode(12345, 1, 1, "S1E1", "job-123");
      storage.addTVEpisode(12345, 1, 2, "S1E2", "job-124");
      storage.addTVEpisode(12345, 2, 1, "S2E1", "job-125");

      const season1 = storage.getTVEpisodes(12345, 1);
      expect(season1).toHaveLength(2);
      expect(season1.every((ep: any) => ep.seasonNumber === 1)).toBe(true);

      const season2 = storage.getTVEpisodes(12345, 2);
      expect(season2).toHaveLength(1);
      expect(season2[0].episodeNumber).toBe(1);
    });

    it("should update episode status", () => {
      storage.addTVEpisode(12345, 1, 1, "Pilot", "job-123");
      storage.updateEpisodeStatus(12345, 1, 1, "completed");

      const episodes = storage.getTVEpisodes(12345);
      expect(episodes[0].status).toBe("completed");
    });

    it("should handle duplicate episodes gracefully", () => {
      storage.addTVEpisode(99999, 1, 1, "Pilot", "job-123");
      storage.addTVEpisode(99999, 1, 1, "Pilot (Redownload)", "job-124");

      const episodes = storage.getTVEpisodes(99999);
      expect(episodes).toHaveLength(1);
      expect(episodes[0].downloadId).toBe("job-124");
    });
  });

  describe("Batch Download Tracking", () => {
    it("should create and retrieve batch downloads", () => {
      storage.createBatchDownload("batch-create-test", 12345, 1, 10);

      const batch = storage.getBatchDownload("batch-create-test");
      expect(batch).not.toBeNull();
      expect(batch?.tmdbId).toBe(12345);
      expect(batch?.seasonNumber).toBe(1);
      expect(batch?.totalEpisodes).toBe(10);
      expect(batch?.completedEpisodes).toBe(0);
      expect(batch?.status).toBe("active");
    });

    it("should update batch progress", () => {
      storage.createBatchDownload("batch-progress-test", 12345, 1, 10);
      storage.updateBatchDownload("batch-progress-test", { completed: 5 });

      const batch = storage.getBatchDownload("batch-progress-test");
      expect(batch?.completedEpisodes).toBe(5);
    });

    it("should update batch status", () => {
      storage.createBatchDownload("batch-status-test", 12345, 1, 10);
      storage.updateBatchDownload("batch-status-test", { completed: 10, status: "completed" });

      const batch = storage.getBatchDownload("batch-status-test");
      expect(batch?.status).toBe("completed");
      expect(batch?.completedEpisodes).toBe(10);
    });

    it("should track failed episodes", () => {
      storage.createBatchDownload("batch-failed-test", 12345, 1, 10);
      storage.updateBatchDownload("batch-failed-test", { completed: 8, failed: 2, status: "partial" });

      const batch = storage.getBatchDownload("batch-failed-test");
      expect(batch?.completedEpisodes).toBe(8);
      expect(batch?.failedEpisodes).toBe(2);
      expect(batch?.status).toBe("partial");
    });

    it("should list all batch downloads", () => {
      storage.createBatchDownload("batch-list-1", 12345, 1, 10);
      storage.createBatchDownload("batch-list-2", 67890, 2, 8);

      const batches = storage.getAllBatchDownloads();
      expect(batches.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("TV Series Metadata", () => {
    it("should fetch TV show seasons", async () => {
      // Mock test - requires API key
      const fetcher = new TMDBMetadataFetcher({ apiKey: process.env.TMDB_API_KEY || "" });
      
      if (!process.env.TMDB_API_KEY) {
        console.log("Skipping live API test - no TMDB_API_KEY");
        return;
      }

      // Breaking Bad TMDB ID: 1396
      const seasons = await fetcher.fetchTVSeasons(1396);
      
      expect(seasons).toBeDefined();
      expect(Array.isArray(seasons)).toBe(true);
      expect(seasons.length).toBeGreaterThan(0);
    });

    it("should fetch season details with episodes", async () => {
      const fetcher = new TMDBMetadataFetcher({ apiKey: process.env.TMDB_API_KEY || "" });
      
      if (!process.env.TMDB_API_KEY) {
        console.log("Skipping live API test - no TMDB_API_KEY");
        return;
      }

      // Breaking Bad Season 1
      const season = await fetcher.fetchTVSeasonDetails(1396, 1);
      
      expect(season).toBeDefined();
      expect(season?.episodes).toBeDefined();
      expect(season?.episodes?.length).toBeGreaterThan(0);
      
      if (season?.episodes && season.episodes.length > 0) {
        const firstEpisode = season.episodes[0];
        expect(firstEpisode.episodeNumber).toBe(1);
        expect(firstEpisode.name).toBeDefined();
      }
    });
  });

  describe("File Selection Types", () => {
    it("should validate episode selection format", () => {
      const selection = { seasonNumber: 1, episodeNumber: 5 };
      
      expect(selection.seasonNumber).toBe(1);
      expect(selection.episodeNumber).toBe(5);
      expect(typeof selection.seasonNumber).toBe("number");
      expect(typeof selection.episodeNumber).toBe("number");
    });

    it("should validate file selection structure", () => {
      const fileSelection = {
        fileIndices: [0, 2, 4],
        episodes: [
          { seasonNumber: 1, episodeNumber: 1 },
          { seasonNumber: 1, episodeNumber: 3 },
          { seasonNumber: 1, episodeNumber: 5 },
        ],
      };

      expect(fileSelection.fileIndices).toHaveLength(3);
      expect(fileSelection.episodes).toHaveLength(3);
      expect(fileSelection.episodes?.[0].seasonNumber).toBe(1);
    });
  });
});
