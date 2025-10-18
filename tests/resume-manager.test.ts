import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ResumeManager } from "../src/resume-manager";
import { StorageManager } from "../src/storage";
import { DownloadJob } from "../src/downloader";
import fs from "fs";
import path from "path";

describe("ResumeManager", () => {
  const testDir = path.join(process.cwd(), "test-data", "resume-test");
  let resumeManager: ResumeManager;
  let storage: StorageManager;

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });

    storage = new StorageManager({ 
      dbPath: path.join(testDir, "test.db"),
      mediaRoot: path.join(testDir, "media")
    });
    resumeManager = new ResumeManager(storage, testDir);
  });

  afterEach(() => {
    // Clean up after tests
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  it("should save and load incomplete downloads", () => {
    const job: DownloadJob = {
      id: "test-download-1",
      sourceType: "torrent",
      sourceUrn: "magnet:?xt=urn:btih:test",
      status: "active",
      progress: { percent: 45, bytesDownloaded: 1024 * 1024 * 50 }
    };

    resumeManager.saveDownloadState(job);
    const incomplete = resumeManager.loadIncompleteDownloads();

    expect(incomplete).toHaveLength(1);
    expect(incomplete[0].id).toBe(job.id);
    expect(incomplete[0].status).toBe("active");
    expect(incomplete[0].progress?.percent).toBe(45);
  });

  it("should not save completed downloads", () => {
    const job: DownloadJob = {
      id: "test-download-2",
      sourceType: "torrent",
      sourceUrn: "magnet:?xt=urn:btih:test",
      status: "completed",
      progress: { percent: 100, bytesDownloaded: 1024 * 1024 * 100 }
    };

    resumeManager.saveDownloadState(job);
    const incomplete = resumeManager.loadIncompleteDownloads();

    expect(incomplete).toHaveLength(0);
  });

  it("should remove download from resume data", () => {
    const job: DownloadJob = {
      id: "test-download-3",
      sourceType: "http",
      sourceUrn: "http://example.com/file.mp4",
      status: "active",
      progress: { percent: 30, bytesDownloaded: 1024 * 1024 * 30 }
    };

    resumeManager.saveDownloadState(job);
    expect(resumeManager.loadIncompleteDownloads()).toHaveLength(1);

    resumeManager.removeDownload(job.id);
    expect(resumeManager.loadIncompleteDownloads()).toHaveLength(0);
  });

  it("should handle multiple downloads", () => {
    const jobs: DownloadJob[] = [
      {
        id: "download-1",
        sourceType: "torrent",
        sourceUrn: "magnet:?xt=urn:btih:1",
        status: "active",
        progress: { percent: 25, bytesDownloaded: 1024 * 1024 * 25 }
      },
      {
        id: "download-2",
        sourceType: "http",
        sourceUrn: "http://example.com/file2.mp4",
        status: "paused",
        progress: { percent: 60, bytesDownloaded: 1024 * 1024 * 60 }
      },
      {
        id: "download-3",
        sourceType: "torrent",
        sourceUrn: "magnet:?xt=urn:btih:3",
        status: "completed",
        progress: { percent: 100, bytesDownloaded: 1024 * 1024 * 100 }
      }
    ];

    jobs.forEach(job => resumeManager.saveDownloadState(job));
    const incomplete = resumeManager.loadIncompleteDownloads();

    expect(incomplete).toHaveLength(2);
    expect(incomplete.map(d => d.id).sort()).toEqual(["download-1", "download-2"]);
  });

  it("should get specific resume data", () => {
    const job: DownloadJob = {
      id: "test-download-4",
      sourceType: "torrent",
      sourceUrn: "magnet:?xt=urn:btih:test4",
      status: "paused",
      progress: { percent: 75, bytesDownloaded: 1024 * 1024 * 75 }
    };

    resumeManager.saveDownloadState(job);
    const resumeData = resumeManager.getResumeData(job.id);

    expect(resumeData).not.toBeNull();
    expect(resumeData?.id).toBe(job.id);
    expect(resumeData?.status).toBe("paused");
    expect(resumeData?.progress?.percent).toBe(75);
  });

  it("should clear all resume data", () => {
    const jobs: DownloadJob[] = [
      {
        id: "download-5",
        sourceType: "torrent",
        sourceUrn: "magnet:?xt=urn:btih:5",
        status: "active",
      },
      {
        id: "download-6",
        sourceType: "http",
        sourceUrn: "http://example.com/file6.mp4",
        status: "paused",
      }
    ];

    jobs.forEach(job => resumeManager.saveDownloadState(job));
    expect(resumeManager.loadIncompleteDownloads()).toHaveLength(2);

    resumeManager.clearAll();
    expect(resumeManager.loadIncompleteDownloads()).toHaveLength(0);
  });

  it("should cleanup stale resume data", () => {
    // Manually create resume data with old timestamps
    const oldData = [
      {
        id: "old-download",
        sourceType: "torrent" as const,
        sourceUrn: "magnet:?xt=urn:btih:old",
        status: "active" as const,
        savedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString() // 40 days ago
      },
      {
        id: "recent-download",
        sourceType: "http" as const,
        sourceUrn: "http://example.com/recent.mp4",
        status: "paused" as const,
        savedAt: new Date().toISOString() // now
      }
    ];

    const resumeFilePath = path.join(testDir, "downloads.json");
    fs.writeFileSync(resumeFilePath, JSON.stringify(oldData, null, 2));

    resumeManager.cleanupStaleData(30); // Clean up data older than 30 days

    const remaining = resumeManager.loadIncompleteDownloads();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe("recent-download");
  });

  it("should handle missing resume file gracefully", () => {
    const incomplete = resumeManager.loadIncompleteDownloads();
    expect(incomplete).toHaveLength(0);
  });

  it("should update existing download state", () => {
    const job: DownloadJob = {
      id: "test-download-7",
      sourceType: "torrent",
      sourceUrn: "magnet:?xt=urn:btih:test7",
      status: "active",
      progress: { percent: 10, bytesDownloaded: 1024 * 1024 * 10 }
    };

    // Save initial state
    resumeManager.saveDownloadState(job);
    
    // Update progress
    job.progress = { percent: 50, bytesDownloaded: 1024 * 1024 * 50 };
    resumeManager.saveDownloadState(job);

    const incomplete = resumeManager.loadIncompleteDownloads();
    expect(incomplete).toHaveLength(1);
    expect(incomplete[0].progress?.percent).toBe(50);
  });
});
