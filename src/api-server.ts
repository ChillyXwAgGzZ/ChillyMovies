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
import { getLogger } from "./logger";
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
      let job: any;
      
      // New metadata-based format: search for torrents first (unless magnet link provided)
      if (body.tmdbId && body.mediaType && body.title) {
        let magnetLink = body.sourceUrn; // Use provided magnet link if available
        let torrentInfo: any = null;
        
        // Only search if no magnet link provided
        if (!magnetLink) {
          const searchQuery = `${body.title} ${body.quality || '1080p'}`;
          getLogger().info(`Searching torrents for: ${searchQuery}`, { context: "download-start" });
          
          try {
            // Search for torrents
            const searchResults = await torrentSearch.search(searchQuery, {
              limit: 10,
              quality: body.quality ? [body.quality] : ['1080p', '720p'],
              minSeeders: 5,
              type: body.mediaType,
            });
            
            if (searchResults.length === 0) {
              res.status(404).json({ 
                success: false, 
                error: "No torrents found. Try different quality or check back later." 
              } as ApiResponse);
              return;
            }
            
            // Pick best torrent (highest seeders)
            const bestTorrent = searchResults.sort((a, b) => b.seeders - a.seeders)[0];
            magnetLink = bestTorrent.magnetLink;
            torrentInfo = {
              seeders: bestTorrent.seeders,
              leechers: bestTorrent.leechers,
              size: bestTorrent.sizeFormatted,
              provider: bestTorrent.provider,
            };
            
            getLogger().info(`Selected torrent: ${bestTorrent.title} (${bestTorrent.seeders} seeders)`, { context: "download-start" });
            
          } catch (searchErr: any) {
            getLogger().error("Torrent search failed", searchErr instanceof Error ? searchErr : new Error(String(searchErr)), { query: searchQuery });
            res.status(500).json({ 
              success: false, 
              error: `Failed to search torrents: ${String(searchErr)}` 
            } as ApiResponse);
            return;
          }
        }
        
        // Generate job ID
        const jobId = `${body.mediaType}-${body.tmdbId}-${body.quality || '1080p'}-${Date.now()}`;
        
        job = {
          id: jobId,
          sourceType: "torrent",
          sourceUrn: magnetLink,
          status: "queued",
          title: body.title,
          metadata: {
            tmdbId: body.tmdbId,
            mediaType: body.mediaType,
            quality: body.quality || '1080p',
            torrentInfo,
          }
        };
      }
      // Legacy format: direct magnet link
      else if (body.id && body.sourceType && body.sourceUrn) {
        job = { 
          id: body.id, 
          sourceType: body.sourceType, 
          sourceUrn: body.sourceUrn, 
          status: "queued" 
        };
      }
      // Invalid format
      else {
        res.status(400).json({ 
          success: false, 
          error: "Invalid request: provide either (tmdbId, mediaType, title) or (id, sourceType, sourceUrn)" 
        } as ApiResponse);
        return;
      }
      
      // Start download
      await downloader.start(job);
      
      // Store metadata in library
      if (job.metadata) {
        storage.addMediaItem(job.id, job.title, job.metadata);
      }
      
      res.json({ success: true, data: { id: job.id, status: job.status } } as ApiResponse);
      
    } catch (err: any) {
      getLogger().error("Download start failed", err instanceof Error ? err : new Error(String(err)), { body });
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

  // List files in a torrent (for season packs)
  app.post("/download/list-files", authMiddleware, async (req: Request, res: Response) => {
    const { magnetLink } = req.body as { magnetLink: string };
    
    if (!magnetLink) {
      res.status(400).json({ success: false, error: "Missing magnetLink" } as ApiResponse);
      return;
    }

    try {
      // Check if downloader supports file listing
      if (typeof (downloader as any).listFiles !== 'function') {
        res.status(501).json({ 
          success: false, 
          error: "Current downloader does not support file listing. Use Aria2 downloader." 
        } as ApiResponse);
        return;
      }

      const files = await (downloader as any).listFiles(magnetLink);
      res.json({ success: true, data: files } as ApiResponse);
      
    } catch (err: any) {
      getLogger().error("Failed to list torrent files", err instanceof Error ? err : new Error(String(err)));
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  // Start batch download (for TV series episodes)
  app.post("/download/batch", authMiddleware, startLimiter, async (req: Request, res: Response) => {
    const body = req.body as StartDownloadRequest;
    
    if (!body.tmdbId || !body.mediaType || body.mediaType !== 'tv') {
      res.status(400).json({ 
        success: false, 
        error: "Batch downloads require tmdbId and mediaType='tv'" 
      } as ApiResponse);
      return;
    }

    if (!body.batchDownload) {
      res.status(400).json({ 
        success: false, 
        error: "Missing batchDownload configuration" 
      } as ApiResponse);
      return;
    }

    try {
      const batchId = `batch-${body.tmdbId}-s${body.seasonNumber || 'all'}-${Date.now()}`;
      const downloads: string[] = [];

      // Handle full season download
      if (body.batchDownload.fullSeason && body.seasonNumber) {
        // Search for season pack
        const searchQuery = `${body.title} S${String(body.seasonNumber).padStart(2, '0')} ${body.quality || '1080p'}`;
        getLogger().info(`Searching for season pack: ${searchQuery}`, { context: "batch-download" });

        const searchResults = await torrentSearch.search(searchQuery, {
          limit: 10,
          quality: body.quality ? [body.quality] : ['1080p', '720p'],
          minSeeders: 5,
          type: 'tv',
        });

        if (searchResults.length === 0) {
          res.status(404).json({ 
            success: false, 
            error: "No season pack found. Try individual episodes." 
          } as ApiResponse);
          return;
        }

        const bestTorrent = searchResults.sort((a, b) => b.seeders - a.seeders)[0];
        const jobId = `${body.mediaType}-${body.tmdbId}-s${body.seasonNumber}-${Date.now()}`;

        const job: any = {
          id: jobId,
          sourceType: "torrent",
          sourceUrn: bestTorrent.magnetLink,
          status: "queued",
          metadata: {
            tmdbId: body.tmdbId,
            mediaType: body.mediaType,
            seasonNumber: body.seasonNumber,
            quality: body.quality || '1080p',
            batchId,
          },
          fileSelection: body.fileSelection,
        };

        await downloader.start(job);
        downloads.push(jobId);
      }
      // Handle specific episodes
      else if (body.batchDownload.episodes && body.batchDownload.episodes.length > 0) {
        const mode = body.batchDownload.mode || 'sequential';
        
        for (const episode of body.batchDownload.episodes) {
          const searchQuery = `${body.title} S${String(episode.seasonNumber).padStart(2, '0')}E${String(episode.episodeNumber).padStart(2, '0')} ${body.quality || '1080p'}`;
          getLogger().info(`Searching for episode: ${searchQuery}`, { context: "batch-download" });

          try {
            const searchResults = await torrentSearch.search(searchQuery, {
              limit: 5,
              quality: body.quality ? [body.quality] : ['1080p', '720p'],
              minSeeders: 3,
              type: 'tv',
            });

            if (searchResults.length === 0) {
              getLogger().warn(`No torrent found for ${searchQuery}`);
              continue;
            }

            const bestTorrent = searchResults.sort((a, b) => b.seeders - a.seeders)[0];
            const jobId = `${body.mediaType}-${body.tmdbId}-s${episode.seasonNumber}e${episode.episodeNumber}-${Date.now()}`;

            const job: any = {
              id: jobId,
              sourceType: "torrent",
              sourceUrn: bestTorrent.magnetLink,
              status: "queued",
              metadata: {
                tmdbId: body.tmdbId,
                mediaType: body.mediaType,
                seasonNumber: episode.seasonNumber,
                episodeNumber: episode.episodeNumber,
                quality: body.quality || '1080p',
                batchId,
              },
            };

            await downloader.start(job);
            downloads.push(jobId);

            // For sequential mode, add a small delay between episodes
            if (mode === 'sequential') {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          } catch (err: any) {
            getLogger().error(`Failed to start download for episode ${searchQuery}`, err instanceof Error ? err : new Error(String(err)));
          }
        }
      }

      res.json({ 
        success: true, 
        data: { 
          batchId, 
          downloads,
          total: downloads.length,
        } 
      } as ApiResponse);

    } catch (err: any) {
      getLogger().error("Batch download failed", err instanceof Error ? err : new Error(String(err)), { body });
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

  // Trailer endpoints
  app.get("/metadata/:mediaType/:id/trailers", async (req: Request, res: Response) => {
    const { mediaType, id } = req.params;
    if (mediaType !== "movie" && mediaType !== "tv") {
      res.status(400).json({ success: false, error: "Invalid media type. Use 'movie' or 'tv'" } as ApiResponse);
      return;
    }

    try {
      const trailers = await metadata.fetchTrailers(parseInt(id), mediaType as "movie" | "tv");
      res.json({ success: true, data: trailers } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  // Similar content endpoint (Phase 3)
  app.get("/metadata/:mediaType/:id/similar", async (req: Request, res: Response) => {
    const { mediaType, id } = req.params;
    if (mediaType !== "movie" && mediaType !== "tv") {
      res.status(400).json({ success: false, error: "Invalid media type. Use 'movie' or 'tv'" } as ApiResponse);
      return;
    }

    try {
      const similar = await metadata.fetchSimilar(parseInt(id), mediaType as "movie" | "tv");
      res.json({ success: true, data: similar } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  // Popular content endpoint
  app.get("/metadata/popular", async (req: Request, res: Response) => {
    const { mediaType = "movie", page = "1" } = req.query as { mediaType?: string; page?: string };
    
    if (mediaType !== "movie" && mediaType !== "tv") {
      res.status(400).json({ success: false, error: "Invalid media type. Use 'movie' or 'tv'" } as ApiResponse);
      return;
    }

    try {
      const results = await metadata.fetchPopular(mediaType as "movie" | "tv", parseInt(page));
      res.json({ success: true, data: results } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  // TV Season endpoints
  app.get("/metadata/tv/:id/seasons", async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const seasons = await metadata.fetchTVSeasons(parseInt(id));
      res.json({ success: true, data: seasons } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  app.get("/metadata/tv/:id/season/:seasonNumber", async (req: Request, res: Response) => {
    const { id, seasonNumber } = req.params;

    try {
      const season = await metadata.fetchTVSeasonDetails(parseInt(id), parseInt(seasonNumber));
      if (!season) {
        res.status(404).json({ success: false, error: "Season not found" } as ApiResponse);
        return;
      }
      res.json({ success: true, data: season } as ApiResponse);
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
      
      // Return results array directly for frontend compatibility
      res.json({ 
        success: true, 
        data: results
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

  // Library list endpoint
  app.get("/library", async (req: Request, res: Response) => {
    try {
      const items = storage.getAllItems();
      res.json({ 
        success: true, 
        data: {
          items,
          count: items.length
        }
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  // Delete library item endpoint
  app.delete("/library/:mediaId", authMiddleware, async (req: Request, res: Response) => {
    const { mediaId } = req.params;
    
    try {
      const item = storage.getItem(mediaId);
      
      if (!item) {
        res.status(404).json({ success: false, error: "Media item not found" } as ApiResponse);
        return;
      }

      // Delete the media file if it exists
      const mediaRoot = storage.getMediaRoot();
      const fs = await import("fs/promises");
      const path = await import("path");
      
      // Attempt to find and delete the media file
      // This is a best-effort deletion - if file doesn't exist, we still remove from library
      try {
        const files = await fs.readdir(mediaRoot);
        // Look for files that might match this media ID
        const matchingFile = files.find((file: string) => file.includes(mediaId));
        
        if (matchingFile) {
          const filePath = path.join(mediaRoot, matchingFile);
          await fs.unlink(filePath);
          getLogger().info(`Deleted media file: ${filePath}`, { mediaId });
        }
      } catch (fileErr) {
        getLogger().warn(`Could not delete media file for ${mediaId}`, { error: String(fileErr) });
        // Continue anyway - remove from library even if file deletion failed
      }

      // Remove from storage
      storage.removeItem(mediaId);
      
      res.json({ 
        success: true, 
        data: { 
          message: "Media deleted successfully",
          deletedId: mediaId
        } 
      } as ApiResponse);
    } catch (err: any) {
      getLogger().error("Library deletion failed", err instanceof Error ? err : new Error(String(err)), { mediaId });
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
