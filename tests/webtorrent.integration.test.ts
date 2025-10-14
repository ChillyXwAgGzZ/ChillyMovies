import { describe, it } from "vitest";
import { WebTorrentDownloader } from "../src/webtorrent-downloader";
import path from "path";

describe("WebTorrentDownloader integration", () => {
  const mediaRoot = path.join(process.cwd(), "test-data", "media");

  // This test is skipped by default as it requires network access and a real torrent
  it.skip("should download real torrent", async () => {
    const d = new WebTorrentDownloader({ mediaRoot });
    const events: any[] = [];

    d.on("started", (job) => events.push({ type: "started", job }));
    d.on("progress", (job) => events.push({ type: "progress", progress: job.progress }));
    d.on("completed", (job) => events.push({ type: "completed", job }));

    // IMPORTANT: Replace with a public domain / legal torrent for integration testing
    const job = {
      id: "real-1",
      sourceType: "torrent" as const,
      sourceUrn: "magnet:?xt=urn:btih:dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c&dn=Big+Buck+Bunny&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fbig-buck-bunny.torrent",
      status: "queued",
    };

    try {
      await d.start(job);

      // wait for progress or completion (up to 30s)
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("timeout")), 30_000);
        d.once("completed", () => {
          clearTimeout(timeout);
          resolve(true);
        });
      });

      console.log("Integration test events:", events);
    } finally {
      await d.cancel(job.id);
    }
  }, 35_000);
});