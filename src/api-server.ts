import express from "express";
import bodyParser from "body-parser";
import { WebTorrentDownloader } from "./webtorrent-downloader";
import { StorageManager } from "./storage";
import { StartDownloadRequest, ApiResponse, StatusResponse } from "./api-types";

export function createServer(opts?: { downloader?: WebTorrentDownloader }) {
  const app = express();
  app.use(bodyParser.json());

  const storage = new StorageManager();
  const downloader = opts?.downloader ?? new WebTorrentDownloader({ storage, mediaRoot: storage.getMediaRoot() });

  app.post("/download/start", async (req, res) => {
    const body = req.body as StartDownloadRequest;
    try {
      const job = { id: body.id, sourceType: body.sourceType, sourceUrn: body.sourceUrn, status: "queued" } as any;
      await downloader.start(job);
      res.json({ success: true, data: job } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  app.post("/download/pause", async (req, res) => {
    const { id } = req.body as { id: string };
    try {
      await downloader.pause(id);
      res.json({ success: true } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  app.post("/download/resume", async (req, res) => {
    const { id } = req.body as { id: string };
    try {
      await downloader.resume(id);
      res.json({ success: true } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  app.get("/download/status/:id", async (req, res) => {
    const id = req.params.id;
    try {
      const status = await downloader.getStatus(id);
      const out: StatusResponse = { id, status: status?.status ?? "unknown", progress: status?.progress };
      res.json({ success: true, data: out } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  app.post("/download/cancel", async (req, res) => {
    const { id } = req.body as { id: string };
    try {
      await downloader.cancel(id);
      res.json({ success: true } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: String(err) } as ApiResponse);
    }
  });

  return app;
}

export default createServer;
