import express from "express";
import bodyParser from "body-parser";
import rateLimit from "express-rate-limit";
import { StorageManager } from "./storage";
import { TMDBMetadataFetcher } from "./metadata";
import { ResumeManager } from "./resume-manager";
import { 
  scanForMissingMedia, 
  validateLibraryOnStartup, 
  relinkMediaFile,
  exportMissingMediaReport,
} from "./missing-media-handler";
import { 
  loadSubtitlesForMedia,
  detectSubtitleFiles,
  type SubtitleTrack,
} from "./subtitle-manager";
import {
  exportLibrary,
  importLibrary,
  createBackup,
  listBackups,
  restoreFromBackup,
  validateExportFormat,
  type ImportOptions,
} from "./export-import";
import { torrentSearch, type SearchOptions } from "./torrent-search";
import { Request, Response } from "express";
import { StartDownloadRequest, ApiResponse, StatusResponse } from "./api-types";

export function createServer(opts?: { downloader?: any; startLimiter?: any; cancelLimiter?: any }) {
  const app = express();
  
  // Enable CORS for development (allow Vite dev server to access the API)
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-api-key");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
  
  app.use(bodyParser.json());

  const storage = new StorageManager();
  const resumeManager = new ResumeManager(storage);
  
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
        d.on("progress", (job: any, progress: any) => {
          broadcast(job.id, { event: "progress", progress });
          resumeManager.saveDownloadState(job); // Save state on progress
        });
        d.on("started", (job: any) => {
          broadcast(job.id, { event: "started", job });
          resumeManager.saveDownloadState(job); // Save state when started
        });
        d.on("completed", (job: any) => {
          broadcast(job.id, { event: "completed", job });
          resumeManager.removeDownload(job.id); // Remove from resume on completion
        });
        d.on("error", (err: any, job: any) => {
          broadcast(job.id, { event: "error", error: String(err) });
          resumeManager.removeDownload(job.id); // Remove from resume on error
        });
        d.on("paused", (job: any) => {
          broadcast(job.id, { event: "paused", job });
          resumeManager.saveDownloadState(job); // Save state when paused
        });
        d.on("canceled", (job: any) => {
          broadcast(job.id, { event: "canceled", job });
          resumeManager.removeDownload(job.id); // Remove from resume on cancellation
        });
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

  // Get incomplete downloads for resume on startup
  app.get("/download/incomplete", async (req: Request, res: Response) => {
    try {
      const incomplete = resumeManager.loadIncompleteDownloads();
      res.json({ success: true, data: incomplete } as ApiResponse);
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
  const metadata = new TMDBMetadataFetcher({ enableCache: true });

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

  // Cache management endpoints
  app.get("/metadata/cache/stats", async (req: Request, res: Response) => {
    try {
      const stats = metadata.getCacheStats();
      res.json({ success: true, data: stats } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  app.post("/metadata/cache/clear", authMiddleware, async (req: Request, res: Response) => {
    try {
      metadata.clearCache();
      res.json({ success: true, data: { message: "Cache cleared" } } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  // Torrent search endpoints
  app.get("/torrents/search", async (req: Request, res: Response) => {
    const { q, limit, quality, minSeeders, providers } = req.query as {
      q?: string;
      limit?: string;
      quality?: string;
      minSeeders?: string;
      providers?: string;
    };

    if (!q) {
      res.status(400).json({ success: false, error: "Missing query parameter 'q'" } as ApiResponse);
      return;
    }

    try {
      const options: SearchOptions = {};
      
      if (limit) options.limit = parseInt(limit);
      if (quality) options.quality = quality.split(',');
      if (minSeeders) options.minSeeders = parseInt(minSeeders);
      if (providers) options.providers = providers.split(',');

      const results = await torrentSearch.search(q, options);
      res.json({ 
        success: true, 
        data: {
          results,
          count: results.length,
          query: q,
          options,
        }
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  app.get("/torrents/providers", async (req: Request, res: Response) => {
    try {
      const providers = torrentSearch.getProviders();
      const status = await torrentSearch.checkProviderStatus();
      
      const providerInfo = providers.map(name => ({
        name,
        available: status.get(name) || false,
      }));

      res.json({ 
        success: true, 
        data: { providers: providerInfo }
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  app.post("/torrents/cache/clear", authMiddleware, async (req: Request, res: Response) => {
    try {
      torrentSearch.clearCache();
      res.json({ success: true, data: { message: "Torrent cache cleared" } } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  // Missing media endpoints (TASK-I6)
  app.get("/library/validate", async (req: Request, res: Response) => {
    try {
      const results = await validateLibraryOnStartup(storage);
      const missingCount = results.filter(r => !r.exists).length;
      res.json({ 
        success: true, 
        data: { 
          results, 
          summary: {
            total: results.length,
            valid: results.length - missingCount,
            missing: missingCount,
          }
        } 
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  app.get("/library/missing", async (req: Request, res: Response) => {
    try {
      const missing = await scanForMissingMedia(storage);
      res.json({ success: true, data: missing } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  app.get("/library/missing/report", async (req: Request, res: Response) => {
    try {
      const missing = await scanForMissingMedia(storage);
      const report = exportMissingMediaReport(missing);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="missing-media-${Date.now()}.json"`);
      res.send(report);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  app.post("/library/relink", authMiddleware, async (req: Request, res: Response) => {
    const { id, newFilePath } = req.body;
    
    if (!id || !newFilePath) {
      res.status(400).json({ success: false, error: "id and newFilePath required" } as ApiResponse);
      return;
    }

    try {
      const success = await relinkMediaFile(storage, id, newFilePath);
      if (success) {
        res.json({ success: true, data: { message: "Media file relinked successfully" } } as ApiResponse);
      } else {
        res.status(400).json({ success: false, error: "Failed to relink media file" } as ApiResponse);
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  // Subtitle endpoints (TASK-I4)
  app.get("/library/:mediaId/subtitles", async (req: Request, res: Response) => {
    const { mediaId } = req.params;
    
    try {
      const tracks = await loadSubtitlesForMedia(storage.getMediaRoot(), mediaId);
      res.json({ success: true, data: tracks } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  app.get("/library/:mediaId/subtitles/detect", async (req: Request, res: Response) => {
    const { mediaId } = req.params;
    
    try {
      const files = detectSubtitleFiles(storage.getMediaRoot(), mediaId);
      res.json({ success: true, data: { files, count: files.length } } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  // Export/Import endpoints (TASK-R6)
  app.get("/library/export", async (req: Request, res: Response) => {
    try {
      const json = await exportLibrary(storage);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="library-export-${Date.now()}.json"`);
      res.send(json);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  app.post("/library/import", authMiddleware, async (req: Request, res: Response) => {
    const { data, options } = req.body;
    
    if (!data) {
      res.status(400).json({ success: false, error: "data field required" } as ApiResponse);
      return;
    }

    try {
      const importOptions: ImportOptions = {
        overwrite: options?.overwrite || false,
        skipExisting: options?.skipExisting !== false, // Default true
        validateFiles: options?.validateFiles || false,
      };
      
      const result = await importLibrary(storage, JSON.stringify(data), importOptions);
      res.json({ success: result.success, data: result } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  app.post("/library/import/validate", async (req: Request, res: Response) => {
    const { data } = req.body;
    
    if (!data) {
      res.status(400).json({ success: false, error: "data field required" } as ApiResponse);
      return;
    }

    try {
      const validation = validateExportFormat(JSON.stringify(data));
      res.json({ success: true, data: validation } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  app.post("/library/backup", authMiddleware, async (req: Request, res: Response) => {
    try {
      const backupPath = await createBackup(storage);
      res.json({ success: true, data: { backupPath } } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  app.get("/library/backups", async (req: Request, res: Response) => {
    try {
      const backups = listBackups();
      res.json({ success: true, data: { backups, count: backups.length } } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  app.post("/library/restore", authMiddleware, async (req: Request, res: Response) => {
    const { backupPath, options } = req.body;
    
    if (!backupPath) {
      res.status(400).json({ success: false, error: "backupPath required" } as ApiResponse);
      return;
    }

    try {
      const importOptions: ImportOptions = {
        overwrite: options?.overwrite || false,
        skipExisting: options?.skipExisting !== false,
        validateFiles: options?.validateFiles || false,
      };
      
      const result = await restoreFromBackup(storage, backupPath, importOptions);
      res.json({ success: result.success, data: result } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  return app;
}

export default createServer;
