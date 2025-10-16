import express from "express";
import bodyParser from "body-parser";
import rateLimit from "express-rate-limit";
import { StorageManager } from "./storage";
import { TMDBMetadataFetcher } from "./metadata";
import { Request, Response } from "express";
import { StartDownloadRequest, ApiResponse, StatusResponse } from "./api-types";

export function createServer(opts?: { downloader?: any; startLimiter?: any; cancelLimiter?: any }) {
  const app = express();
  app.use(bodyParser.json());

  const storage = new StorageManager();
  // Lazy loader: defer importing WebTorrentDownloader to avoid native module loads during unit tests
  const makeLazyDownloader = () => {
    let real: any = null;
    return {
      async _init() {
        if (!real) {
          const mod = await import("./webtorrent-downloader");
          real = new mod.WebTorrentDownloader({ storage, mediaRoot: storage.getMediaRoot() });
        }
        return real;
      },
      async start(job: any) {
        const r = await this._init();
        return r.start(job);
      },
      async pause(id: string) {
        const r = await this._init();
        return r.pause(id);
      },
      async resume(id: string) {
        const r = await this._init();
        return r.resume(id);
      },
      async getStatus(id: string) {
        const r = await this._init();
        return r.getStatus(id);
      },
      async cancel(id: string) {
        const r = await this._init();
        return r.cancel(id);
      },
    } as any;
  };

  const downloader = opts?.downloader ?? makeLazyDownloader();

  // Simple API key auth middleware
  const apiKey = process.env.API_SECRET;
  function authMiddleware(req: Request, res: Response, next: any) {
    if (!apiKey) return next(); // if not set, allow
    const key = req.headers["x-api-key"] || req.query.api_key;
    if (key === apiKey) return next();
    res.status(401).json({ success: false, error: "unauthorized" });
  }

  const startLimiter = opts?.startLimiter ?? rateLimit({ windowMs: 60 * 1000, max: 10 });
  const cancelLimiter = opts?.cancelLimiter ?? rateLimit({ windowMs: 60 * 1000, max: 20 });

  // Event broadcaster for SSE
  const clients: Map<string, Set<Response>> = new Map();

  function broadcast(id: string, payload: any) {
    const set = clients.get(id);
    if (!set) return;
    for (const res of set) {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  }

  // Bind downloader events to broadcaster
  (async () => {
    if ((downloader as any)._init) {
      // If lazy downloader, don't init now - bind after first start
    } else {
      // downloader is concrete
      const d = downloader as any;
      if (d && d.on) {
        d.on("progress", (job: any, progress: any) => broadcast(job.id, { event: "progress", progress }));
        d.on("started", (job: any) => broadcast(job.id, { event: "started", job }));
        d.on("completed", (job: any) => broadcast(job.id, { event: "completed", job }));
        d.on("error", (err: any, job: any) => broadcast(job.id, { event: "error", error: String(err) }));
      }
    }
  })();

  app.post("/download/start", authMiddleware, startLimiter, async (req: Request, res: Response) => {
    const body = req.body as StartDownloadRequest;
    try {
      const job = { id: body.id, sourceType: body.sourceType, sourceUrn: body.sourceUrn, status: "queued" } as any;
      await downloader.start(job);
      res.json({ success: true, data: job } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  // SSE endpoint for real-time progress
  app.get("/events/:id", (req: Request, res: Response) => {
    const id = req.params.id;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    if (!clients.has(id)) clients.set(id, new Set());
    clients.get(id)!.add(res);

    req.on("close", () => {
      const set = clients.get(id);
      if (set) set.delete(res);
    });
  });

  app.post("/download/pause", authMiddleware, async (req: Request, res: Response) => {
    const { id } = req.body as { id: string };
    try {
      await downloader.pause(id);
      res.json({ success: true } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  app.post("/download/resume", authMiddleware, async (req: Request, res: Response) => {
    const { id } = req.body as { id: string };
    try {
      await downloader.resume(id);
      res.json({ success: true } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  app.get("/download/status/:id", async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
      const status = await downloader.getStatus(id);
      const out: StatusResponse = { id, status: status?.status ?? "unknown", progress: status?.progress };
      res.json({ success: true, data: out } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  app.post("/download/cancel", authMiddleware, cancelLimiter, async (req: Request, res: Response) => {
    const { id } = req.body as { id: string };
    try {
      await downloader.cancel(id);
      res.json({ success: true } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  // Metadata endpoints
  const metadata = new TMDBMetadataFetcher();

  app.get("/metadata/search", async (req: Request, res: Response) => {
    const { q } = req.query as { q?: string };
    if (!q) {
      res.status(400).json({ success: false, error: "Missing query parameter 'q'" } as ApiResponse);
      return;
    }

    try {
      const results = await metadata.searchByTitle(q);
      res.json({ success: true, data: results } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  app.get("/metadata/:mediaType/:id", async (req: Request, res: Response) => {
    const { mediaType, id } = req.params;
    if (mediaType !== "movie" && mediaType !== "tv") {
      res.status(400).json({ success: false, error: "Invalid media type. Use 'movie' or 'tv'" } as ApiResponse);
      return;
    }

    try {
      const result = await metadata.fetchByTMDBId(parseInt(id), mediaType as "movie" | "tv");
      if (!result) {
        res.status(404).json({ success: false, error: "Not found" } as ApiResponse);
        return;
      }
      res.json({ success: true, data: result } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  return app;
}

export default createServer;
