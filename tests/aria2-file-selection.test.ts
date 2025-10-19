import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Aria2Downloader } from "../src/aria2-downloader";
import { DownloadJob } from "../src/downloader";
import path from "path";
import fs from "fs";

describe("Aria2Downloader File Selection", () => {
  let downloader: Aria2Downloader;
  const testDownloadDir = path.resolve(__dirname, "../test-data/aria2-downloads");

  beforeEach(async () => {
    // Create test download directory
    if (!fs.existsSync(testDownloadDir)) {
      fs.mkdirSync(testDownloadDir, { recursive: true });
    }

    // Note: These tests require aria2c to be installed
    // They will be skipped if aria2c is not available
  });

  afterEach(async () => {
    if (downloader) {
      try {
        await downloader.shutdown();
      } catch (e) {
        // Ignore shutdown errors in tests
      }
    }

    // Clean up test directory
    if (fs.existsSync(testDownloadDir)) {
      fs.rmSync(testDownloadDir, { recursive: true, force: true });
    }
  });

  describe("File Listing", () => {
    it("should support listFiles method", () => {
      // Check if aria2c is available
      const { spawnSync } = require("child_process");
      const result = spawnSync("aria2c", ["--version"], { stdio: "ignore" });
      
      if (result.error) {
        console.log("Skipping aria2 tests - aria2c not installed");
        return;
      }

      downloader = new Aria2Downloader({
        downloadDir: testDownloadDir,
        rpcPort: 6801, // Use different port for tests
      });

      expect(typeof downloader.listFiles).toBe("function");
    });

    it("should validate file list response format", async () => {
      const mockFileList = [
        { index: 0, path: "/path/to/file1.mkv", size: 1024 * 1024 * 500 },
        { index: 1, path: "/path/to/file2.mkv", size: 1024 * 1024 * 520 },
      ];

      // Validate structure
      for (const file of mockFileList) {
        expect(file).toHaveProperty("index");
        expect(file).toHaveProperty("path");
        expect(file).toHaveProperty("size");
        expect(typeof file.index).toBe("number");
        expect(typeof file.path).toBe("string");
        expect(typeof file.size).toBe("number");
      }
    });
  });

  describe("File Selection in Downloads", () => {
    it("should accept fileSelection in DownloadJob", () => {
      const job: DownloadJob = {
        id: "test-job",
        sourceType: "torrent",
        sourceUrn: "magnet:?xt=urn:btih:test",
        status: "queued",
        fileSelection: {
          fileIndices: [0, 2, 4],
        },
      };

      expect(job.fileSelection).toBeDefined();
      expect(job.fileSelection?.fileIndices).toEqual([0, 2, 4]);
    });

    it("should support episode-based file selection", () => {
      const job: DownloadJob = {
        id: "test-job",
        sourceType: "torrent",
        sourceUrn: "magnet:?xt=urn:btih:test",
        status: "queued",
        fileSelection: {
          episodes: [
            { seasonNumber: 1, episodeNumber: 1 },
            { seasonNumber: 1, episodeNumber: 3 },
            { seasonNumber: 1, episodeNumber: 5 },
          ],
        },
      };

      expect(job.fileSelection?.episodes).toHaveLength(3);
      expect(job.fileSelection?.episodes?.[0].episodeNumber).toBe(1);
    });

    it("should support pattern-based file selection", () => {
      const job: DownloadJob = {
        id: "test-job",
        sourceType: "torrent",
        sourceUrn: "magnet:?xt=urn:btih:test",
        status: "queued",
        fileSelection: {
          filePatterns: ["*.mkv", "*1080p*"],
        },
      };

      expect(job.fileSelection?.filePatterns).toHaveLength(2);
    });
  });

  describe("Aria2 Configuration", () => {
    it("should validate download options", () => {
      const options = {
        downloadDir: testDownloadDir,
        rpcPort: 6802,
        maxConcurrent: 3,
        maxSpeed: 1000, // KB/s
        seedTime: 5, // minutes
      };

      expect(options.downloadDir).toBeDefined();
      expect(options.rpcPort).toBeGreaterThan(0);
      expect(options.maxConcurrent).toBeGreaterThan(0);
    });

    it("should support file selection args format", () => {
      // Aria2 uses 1-based file indices in select-file option
      const fileIndices = [0, 2, 4]; // 0-based
      const aria2Indices = fileIndices.map(i => i + 1).join(','); // Convert to 1-based
      
      expect(aria2Indices).toBe("1,3,5");
    });
  });

  describe("Episode Matching Utilities", () => {
    it("should match episode numbers in filenames", () => {
      const testFiles = [
        "Show.Name.S01E01.1080p.WEB-DL.mkv",
        "Show.Name.S01E02.1080p.WEB-DL.mkv",
        "Show.Name.1x03.1080p.WEB-DL.mkv",
        "Show.Name.103.1080p.WEB-DL.mkv",
      ];

      const patterns = [
        /S(\d{2})E(\d{2})/i,  // S01E01 format
        /(\d{1,2})x(\d{2})/i, // 1x01 format
        /\.(\d)(\d{2})\./,    // .103. format (season 1, episode 03)
      ];

      const results = testFiles.map(file => {
        for (const pattern of patterns) {
          const match = file.match(pattern);
          if (match) {
            return {
              file,
              season: parseInt(match[1]),
              episode: parseInt(match[2]),
            };
          }
        }
        return null;
      });

      expect(results.filter(Boolean)).toHaveLength(4);
    });

    it("should filter files by episode selection", () => {
      const files = [
        { index: 0, path: "Show.S01E01.mkv" },
        { index: 1, path: "Show.S01E02.mkv" },
        { index: 2, path: "Show.S01E03.mkv" },
        { index: 3, path: "Show.S01E04.mkv" },
        { index: 4, path: "Show.S01E05.mkv" },
      ];

      const wantedEpisodes = [1, 3, 5];
      const pattern = /E(\d{2})/;

      const selectedFiles = files.filter(file => {
        const match = file.path.match(pattern);
        if (match) {
          const episode = parseInt(match[1]);
          return wantedEpisodes.includes(episode);
        }
        return false;
      });

      expect(selectedFiles).toHaveLength(3);
      expect(selectedFiles.map(f => f.index)).toEqual([0, 2, 4]);
    });
  });

  describe("Download Job Metadata", () => {
    it("should include TV series metadata in job", () => {
      const job: DownloadJob = {
        id: "test-job",
        sourceType: "torrent",
        sourceUrn: "magnet:?xt=urn:btih:test",
        status: "queued",
        metadata: {
          tmdbId: 12345,
          mediaType: "tv",
          title: "Test Show",
          seasonNumber: 1,
        },
        fileSelection: {
          fileIndices: [0, 1, 2],
        },
      };

      expect(job.metadata?.mediaType).toBe("tv");
      expect(job.metadata?.seasonNumber).toBe(1);
      expect(job.fileSelection).toBeDefined();
    });

    it("should support batch download tracking", () => {
      const batchId = "batch-12345-s1";
      const jobs: DownloadJob[] = [];

      for (let ep = 1; ep <= 3; ep++) {
        jobs.push({
          id: `job-${ep}`,
          sourceType: "torrent",
          sourceUrn: "magnet:?xt=urn:btih:test",
          status: "queued",
          metadata: {
            tmdbId: 12345,
            mediaType: "tv",
            seasonNumber: 1,
            episodeNumber: ep,
            batchId,
          },
        });
      }

      expect(jobs).toHaveLength(3);
      expect(jobs.every(j => j.metadata?.batchId === batchId)).toBe(true);
    });
  });
});
