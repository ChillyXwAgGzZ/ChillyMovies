import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import rateLimit from "express-rate-limit";
import createServer from "../src/api-server";

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

function makeTestLimiter() {
  return rateLimit({ windowMs: 500, max: 3, standardHeaders: true, legacyHeaders: false, message: "Too many requests" });
}

describe("API rate limiting", () => {
  const mock = new MockDownloader();
  let app: any;

  beforeEach(() => {
    delete process.env.API_SECRET;
    app = createServer({ downloader: mock as any, startLimiter: makeTestLimiter(), cancelLimiter: makeTestLimiter() });
  });

  afterEach(() => {
    delete process.env.API_SECRET;
  });

  it("allows up to 3 start requests then returns 429", async () => {
    for (let i = 0; i < 3; i++) {
      const res = await request(app).post("/download/start").send({ id: `s${i}` });
      expect(res.status).toBe(200);
    }

    const res4 = await request(app).post("/download/start").send({ id: "s3" });
    expect(res4.status).toBe(429);
    expect(String(res4.text)).toContain("Too many requests");
  });

  it("resets after window expires", async () => {
    for (let i = 0; i < 3; i++) {
      const res = await request(app).post("/download/start").send({ id: `r${i}` });
      expect(res.status).toBe(200);
    }

    const res4 = await request(app).post("/download/start").send({ id: "r3" });
    expect(res4.status).toBe(429);

    // wait for window to expire
    await new Promise((r) => setTimeout(r, 600));

    const resAfter = await request(app).post("/download/start").send({ id: "r-after" });
    expect(resAfter.status).toBe(200);
  });

  it("cancel limiter enforces same rules", async () => {
    for (let i = 0; i < 3; i++) {
      const res = await request(app).post("/download/cancel").send({ id: `c${i}` });
      expect(res.status).toBe(200);
    }

    const res4 = await request(app).post("/download/cancel").send({ id: "c3" });
    expect(res4.status).toBe(429);
  });

  it("rate limiter behavior is the same when auth is enabled", async () => {
    process.env.API_SECRET = "s3cr3t";
    app = createServer({ downloader: mock as any, startLimiter: makeTestLimiter(), cancelLimiter: makeTestLimiter() });

    // without key -> 401 (auth triggers first), but limiter should still track requests that passed auth
    const unauth = await request(app).post("/download/start").send({ id: "x1" });
    expect(unauth.status).toBe(401);

    // with key we can exercise limiter
    for (let i = 0; i < 3; i++) {
      const r = await request(app).post("/download/start").set("x-api-key", "s3cr3t").send({ id: `k${i}` });
      expect(r.status).toBe(200);
    }

    const r4 = await request(app).post("/download/start").set("x-api-key", "s3cr3t").send({ id: "k3" });
    expect(r4.status).toBe(429);
  });
});
