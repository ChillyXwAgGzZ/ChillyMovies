import { describe, it, expect, vi, beforeAll } from "vitest";
import { WebTorrentDownloader } from "../src/webtorrent-downloader";
import WebTorrent from "webtorrent";
import EventEmitter from "eventemitter3";
import path from "path";
import fs from "fs";

// Mock WebTorrent client & torrent
class MockTorrent extends EventEmitter {
  downloaded = 0;
  length = 100000; // larger file size so progress test has time to run
  path = "";
  paused = false;

  constructor() {
    super();
    // simulate download progress
    const interval = setInterval(() => {
      if (this.paused) return;
      this.downloaded += 1000;
      this.emit("download");
      if (this.downloaded >= this.length) {
        this.emit("done");
        clearInterval(interval);
      }
    }, 10);
  }

  pause() {
    this.paused = true;
    this.emit("paused");
  }

  resume() {
    this.paused = false;
    this.emit("resumed");
    // emit one progress event immediately on resume
    this.downloaded += 1000;
    this.emit("download");
  }

  destroy() {
    this.removeAllListeners();
  }
}

class MockClient extends EventEmitter {
  private torrents: MockTorrent[] = [];

  add(magnetURI: string, opts: any, cb?: (torrent: any) => void) {
    const t = new MockTorrent();
    this.torrents.push(t);
    if (cb) setTimeout(() => cb(t), 1);
    return t;
  }
}

// Mock WebTorrent module
vi.mock("webtorrent", () => {
  return {
    default: function () {
      return new MockClient();
    },
  };
});

describe("WebTorrentDownloader", () => {
  const mediaRoot = path.join(process.cwd(), "test-data", "media");
  
  beforeAll(() => {
    if (!fs.existsSync(mediaRoot)) {
      fs.mkdirSync(mediaRoot, { recursive: true });
    }
  });

  it("should download and emit progress/completion events", async () => {
    const d = new WebTorrentDownloader({ mediaRoot });
    const events: any[] = [];

    d.on("started", (job) => events.push({ type: "started", job }));
    d.on("progress", (job) => events.push({ type: "progress", job }));
    d.on("completed", (job) => events.push({ type: "completed", job }));

    const job = { id: "job-1", sourceType: "torrent" as const, sourceUrn: "magnet:test", status: "queued" as const };
    await d.start(job);

    // wait for completion (mocked progress is fast)
    await new Promise((r) => setTimeout(r, 200));

    expect(events.length).toBeGreaterThan(2);
    expect(events[0].type).toBe("started");
    expect(events[events.length - 1].type).toBe("completed");
    expect(job.status).toBe("completed");
  });

  it("should support pause/resume", async () => {
    const d = new WebTorrentDownloader({ mediaRoot });
    let lastProgress = 0;
    const progressValues: number[] = [];

    d.on("progress", (job) => {
      const p = job.progress?.percent || 0;
      progressValues.push(p);
      lastProgress = p;
    });

    const job = { id: "job-2", sourceType: "torrent" as const, sourceUrn: "magnet:test2", status: "queued" as const };
    await d.start(job);

    // wait for multiple progress updates
    await new Promise((r) => setTimeout(r, 50));
    const beforePause = progressValues.length;

    // pause and verify progress stops
    await d.pause(job.id);
    await new Promise((r) => setTimeout(r, 50));
    const afterPause = progressValues.length;
    expect(afterPause).toBe(beforePause); // no new progress events while paused

    // resume and verify progress continues
    await d.resume(job.id);
    await new Promise((r) => setTimeout(r, 50));
    expect(progressValues.length).toBeGreaterThan(afterPause); // new progress after resume
  });

  it("should handle cancel and cleanup", async () => {
    const d = new WebTorrentDownloader({ mediaRoot });
    const events: any[] = [];

    d.on("canceled", (job) => events.push({ type: "canceled", job }));

    const job = { id: "job-3", sourceType: "torrent" as const, sourceUrn: "magnet:test3", status: "queued" as const };
    await d.start(job);
    await new Promise((r) => setTimeout(r, 10));
    await d.cancel(job.id);

    expect(events.length).toBe(1);
    expect(events[0].type).toBe("canceled");
    expect(job.status).toBe("canceled");

    // verify job is removed
    const status = await d.getStatus(job.id);
    expect(status).toBeNull();
  });
});