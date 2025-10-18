import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import createServer from "../src/api-server";
import { config } from "dotenv";

// Load environment variables
config();

// Mock logger
vi.mock('../src/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}));

class MockDownloader {
  async start(job: any) {
    job.status = "active";
  }
  async pause(id: string) {}
  async resume(id: string) {}
  async cancel(id: string) {}
  async getStatus(id: string) {
    return { id, status: "active", progress: { percent: 10, bytesDownloaded: 1000 } };
  }
}

describe("API server", () => {
  const mock = new MockDownloader();
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

  it("fetches trailers for a movie", async () => {
    const res = await request(app).get("/metadata/movie/550/trailers");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("fetches trailers for a TV show", async () => {
    const res = await request(app).get("/metadata/tv/1399/trailers");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("returns 400 for invalid media type in trailer endpoint", async () => {
    const res = await request(app).get("/metadata/invalid/550/trailers");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("Invalid media type");
  });
});
