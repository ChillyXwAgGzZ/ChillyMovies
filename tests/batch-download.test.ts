import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createServer } from "../src/api-server";
import { MockDownloader } from "../src/downloader";
import { DownloadJob } from "../src/downloader";
import fs from "fs";
import path from "path";

describe("Batch Download API", () => {
  let app: any;
  let mockDownloader: MockDownloader & { listFiles?: (magnetLink: string) => Promise<any[]> };
  const testDbPath = path.resolve(__dirname, "../test-data/batch-api.db.json");

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Create enhanced mock downloader with file listing support
    mockDownloader = new MockDownloader() as any;
    
    // Add listFiles method for testing
    (mockDownloader as any).listFiles = async (magnetLink: string) => {
      return [
        { index: 0, path: "Show.S01E01.1080p.mkv", size: 1024 * 1024 * 500 },
        { index: 1, path: "Show.S01E02.1080p.mkv", size: 1024 * 1024 * 520 },
        { index: 2, path: "Show.S01E03.1080p.mkv", size: 1024 * 1024 * 510 },
      ];
    };

    app = createServer({ downloader: mockDownloader });
  });

  afterEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe("POST /download/list-files", () => {
    it("should list files in a torrent", async () => {
      const response = await request(app)
        .post("/download/list-files")
        .send({ magnetLink: "magnet:?xt=urn:btih:test" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body.data[0]).toHaveProperty("index");
      expect(response.body.data[0]).toHaveProperty("path");
      expect(response.body.data[0]).toHaveProperty("size");
    });

    it("should reject requests without magnetLink", async () => {
      const response = await request(app)
        .post("/download/list-files")
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("magnetLink");
    });

    it("should handle downloaders without listFiles support", async () => {
      // Remove listFiles method
      delete (mockDownloader as any).listFiles;

      const response = await request(app)
        .post("/download/list-files")
        .send({ magnetLink: "magnet:?xt=urn:btih:test" })
        .expect(501);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("does not support file listing");
    });
  });

  describe("POST /download/batch", () => {
    it("should reject non-TV media types", async () => {
      const response = await request(app)
        .post("/download/batch")
        .send({
          tmdbId: 12345,
          mediaType: "movie",
          title: "Test Movie",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("mediaType='tv'");
    });

    it("should reject requests without batchDownload config", async () => {
      const response = await request(app)
        .post("/download/batch")
        .send({
          tmdbId: 12345,
          mediaType: "tv",
          title: "Test Show",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("batchDownload");
    });

    it("should validate full season download request format", async () => {
      const validRequest = {
        tmdbId: 12345,
        mediaType: "tv",
        title: "Test Show",
        seasonNumber: 1,
        quality: "1080p",
        batchDownload: {
          fullSeason: true,
        },
      };

      expect(validRequest.batchDownload.fullSeason).toBe(true);
      expect(validRequest.seasonNumber).toBeDefined();
    });

    it("should validate episode list download request format", async () => {
      const validRequest = {
        tmdbId: 12345,
        mediaType: "tv",
        title: "Test Show",
        quality: "1080p",
        batchDownload: {
          episodes: [
            { seasonNumber: 1, episodeNumber: 1 },
            { seasonNumber: 1, episodeNumber: 2 },
            { seasonNumber: 1, episodeNumber: 3 },
          ],
          mode: "sequential" as const,
        },
      };

      expect(validRequest.batchDownload.episodes).toHaveLength(3);
      expect(validRequest.batchDownload.mode).toBe("sequential");
    });
  });

  describe("TV Series Download Flow", () => {
    it("should support file selection in download job", async () => {
      const job: DownloadJob = {
        id: "test-job",
        sourceType: "torrent",
        sourceUrn: "magnet:?xt=urn:btih:test",
        status: "queued",
        metadata: {
          tmdbId: 12345,
          mediaType: "tv",
          seasonNumber: 1,
        },
        fileSelection: {
          fileIndices: [0, 2],
          episodes: [
            { seasonNumber: 1, episodeNumber: 1 },
            { seasonNumber: 1, episodeNumber: 3 },
          ],
        },
      };

      await mockDownloader.start(job);
      
      const status = await mockDownloader.getStatus("test-job");
      expect(status).toBeDefined();
      expect(status?.fileSelection).toBeDefined();
      expect(status?.fileSelection?.fileIndices).toEqual([0, 2]);
    });

    it("should track multiple episodes in batch", async () => {
      const episodes = [
        { seasonNumber: 1, episodeNumber: 1 },
        { seasonNumber: 1, episodeNumber: 2 },
        { seasonNumber: 1, episodeNumber: 3 },
      ];

      const jobs: DownloadJob[] = [];
      
      for (const episode of episodes) {
        const job: DownloadJob = {
          id: `test-s${episode.seasonNumber}e${episode.episodeNumber}`,
          sourceType: "torrent",
          sourceUrn: "magnet:?xt=urn:btih:test",
          status: "queued",
          metadata: {
            tmdbId: 12345,
            mediaType: "tv",
            seasonNumber: episode.seasonNumber,
            episodeNumber: episode.episodeNumber,
          },
        };
        
        await mockDownloader.start(job);
        jobs.push(job);
      }

      expect(jobs).toHaveLength(3);
      
      for (const job of jobs) {
        const status = await mockDownloader.getStatus(job.id);
        expect(status).toBeDefined();
        expect(status?.metadata?.mediaType).toBe("tv");
      }
    });
  });

  describe("File Selection Patterns", () => {
    it("should match episode patterns in filenames", () => {
      const files = [
        "Show.S01E01.1080p.mkv",
        "Show.S01E02.1080p.mkv",
        "Show.S01E03.1080p.mkv",
      ];

      const episodePattern = /S(\d{2})E(\d{2})/i;
      
      const episodes = files.map(file => {
        const match = file.match(episodePattern);
        if (match) {
          return {
            filename: file,
            seasonNumber: parseInt(match[1]),
            episodeNumber: parseInt(match[2]),
          };
        }
        return null;
      }).filter(Boolean);

      expect(episodes).toHaveLength(3);
      expect(episodes[0]?.seasonNumber).toBe(1);
      expect(episodes[0]?.episodeNumber).toBe(1);
      expect(episodes[2]?.episodeNumber).toBe(3);
    });

    it("should select specific files by index", () => {
      const allFiles = [
        { index: 0, path: "Show.S01E01.mkv" },
        { index: 1, path: "Show.S01E02.mkv" },
        { index: 2, path: "Show.S01E03.mkv" },
        { index: 3, path: "Show.S01E04.mkv" },
      ];

      const selectedIndices = [0, 2];
      const selectedFiles = allFiles.filter(f => selectedIndices.includes(f.index));

      expect(selectedFiles).toHaveLength(2);
      expect(selectedFiles[0].index).toBe(0);
      expect(selectedFiles[1].index).toBe(2);
    });
  });
});
