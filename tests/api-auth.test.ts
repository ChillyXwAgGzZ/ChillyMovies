import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
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

describe("API authentication", () => {
  const mock = new MockDownloader();
  let app: any;

  beforeEach(() => {
    // create server fresh for each test so env-based middleware picks up changes
    app = createServer({ downloader: mock as any });
  });

  afterEach(() => {
    // ensure tests don't leak API_SECRET across cases
    delete process.env.API_SECRET;
  });

  it("allows requests when API_SECRET is not set (public mode)", async () => {
    delete process.env.API_SECRET;

    const start = await request(app).post("/download/start").send({ id: "a" });
    expect(start.status).toBe(200);

    const pause = await request(app).post("/download/pause").send({ id: "a" });
    expect(pause.status).toBe(200);

    const resume = await request(app).post("/download/resume").send({ id: "a" });
    expect(resume.status).toBe(200);

    const status = await request(app).get("/download/status/a");
    expect(status.status).toBe(200);

    const cancel = await request(app).post("/download/cancel").send({ id: "a" });
    expect(cancel.status).toBe(200);
  });

  it("rejects requests without key when API_SECRET is set", async () => {
    process.env.API_SECRET = "supersecret";
    app = createServer({ downloader: mock as any });

    const res = await request(app).post("/download/start").send({ id: "b" });
    expect(res.status).toBe(401);
  });

  it("rejects requests with incorrect key", async () => {
    process.env.API_SECRET = "supersecret";
    app = createServer({ downloader: mock as any });

    const res = await request(app).post("/download/start").set("x-api-key", "wrong").send({ id: "b" });
    expect(res.status).toBe(401);
  });

  it("accepts requests with correct key in header", async () => {
    process.env.API_SECRET = "supersecret";
    app = createServer({ downloader: mock as any });

    const res = await request(app).post("/download/start").set("x-api-key", "supersecret").send({ id: "b" });
    expect(res.status).toBe(200);
  });

  it("accepts requests with correct key in query param", async () => {
    process.env.API_SECRET = "supersecret";
    app = createServer({ downloader: mock as any });

    const res = await request(app).post("/download/start?api_key=supersecret").send({ id: "b" });
    expect(res.status).toBe(200);
  });
});
