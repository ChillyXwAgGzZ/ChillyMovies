import WebTorrent, { Torrent, TorrentOptions } from "webtorrent";
import { EventEmitter } from "eventemitter3";
import { Downloader, DownloadJob } from "./downloader";
import { withRetry } from "./retry";
import path from "path";
import fs from "fs";
import { StorageManager } from "./storage";

export interface WebTorrentDownloaderOptions {
  clientOptions?: TorrentOptions;
  mediaRoot?: string;
  storage?: StorageManager;
}

export class WebTorrentDownloader extends EventEmitter implements Downloader {
  private client: WebTorrent.Instance;
  private jobs = new Map<string, { torrent?: Torrent; job: DownloadJob; filePath?: string }>();
  private mediaRoot: string;
  private storage: StorageManager;

  constructor(opts: WebTorrentDownloaderOptions = {}) {
    super();
    this.client = new WebTorrent();
    this.mediaRoot = opts.mediaRoot ?? path.resolve(process.cwd(), "media");
    this.storage = opts['storage'] ?? new StorageManager({ mediaRoot: this.mediaRoot });
    if (!fs.existsSync(this.mediaRoot)) fs.mkdirSync(this.mediaRoot, { recursive: true });
  }

  async start(job: DownloadJob) {
    if (job.sourceType !== "torrent") throw new Error("WebTorrentDownloader only supports torrent sources");
    this.jobs.set(job.id, { job });

    await withRetry(async () => {
      return new Promise<void>((resolve, reject) => {
        const torrent = this.client.add(job.sourceUrn, { path: this.mediaRoot }, (t) => {
          // on ready or metadata
          this.jobs.get(job.id)!.torrent = t;
          job.status = "active";
          this.emit("started", job);
        });

        torrent.on("download", () => {
          const progress = (torrent.downloaded / torrent.length) * 100 || 0;
          job.progress = { percent: Math.min(100, Math.round(progress)), bytesDownloaded: torrent.downloaded };
          this.emit("progress", job, job.progress);
        });

        torrent.on("done", () => {
          job.status = "completed";
          this.emit("progress", job, job.progress);
          this.emit("completed", job);
          resolve();
        });

        torrent.on("error", (err) => {
          job.status = "failed";
          this.emit("error", err, job);
          // Attempt to cleanup partials on error
          try {
            this.storage.removePartial(job.id);
          } catch (e) {
            // ignore
          }
          reject(err);
        });
      });
    }, { retries: 2 });
  }

  async pause(jobId: string) {
    const entry = this.jobs.get(jobId);
    if (!entry || !entry.torrent) throw new Error("job not active");
    entry.torrent.pause();
    entry.job.status = "paused";
    this.emit("paused", entry.job);
  }

  async resume(jobId: string) {
    const entry = this.jobs.get(jobId);
    if (!entry || !entry.torrent) throw new Error("job not active");
    entry.torrent.resume();
    entry.job.status = "active";
    this.emit("resumed", entry.job);
  }

  async cancel(jobId: string) {
    const entry = this.jobs.get(jobId);
    if (!entry) throw new Error("job not found");
    if (entry.torrent) {
      entry.torrent.destroy({ destroyStore: true });
    }
    entry.job.status = "canceled";
    this.jobs.delete(jobId);
    this.emit("canceled", entry.job);
  }

  async getStatus(jobId: string) {
    const entry = this.jobs.get(jobId);
    return entry ? entry.job : null;
  }
}
