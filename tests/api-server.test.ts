import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import createServer from "../src/api-server";
import { WebTorrentDownloader } from "../src/webtorrent-downloader";

class MockDownloader extends (WebTorrentDownloader as any) {
  start = async (job: any) => { job.status = "active"; };
  pause = async (id: string) => {};
  resume = async (id: string) => {};
  cancel = async (id: string) => {};
  getStatus = async (id: string) => ({ id, status: "active", progress: { percent: 10, bytesDownloaded: 1000 } });
}

describe("API server", () => {
  const mock = new MockDownloader({});
  const app = createServer({ downloader: mock as any });

  it("starts a download", async () => {
    const res = await request(app).post("/download/start").send({ id: "a", sourceType: "torrent", sourceUrn: "magnet:fake" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe("a");
  });

  it("pauses a download", async () => {
    const res = await request(app).post("/download/pause").send({ id: "a" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("resumes a download", async () => {
    const res = await request(app).post("/download/resume").send({ id: "a" });
    expect(res.status).toBe(200);
  });

  it("gets status", async () => {
    const res = await request(app).get("/download/status/a");
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("a");
  });

  it("cancels a download", async () => {
    const res = await request(app).post("/download/cancel").send({ id: "a" });
    expect(res.status).toBe(200);
  });
});
