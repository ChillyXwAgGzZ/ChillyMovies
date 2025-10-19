import { EventEmitter } from "eventemitter3";
import { UUID, Progress } from "./types";

export type DownloadStatus =
  | "queued"
  | "active"
  | "paused"
  | "completed"
  | "failed"
  | "canceled";

export interface DownloadJob {
  id: UUID;
  sourceType: "torrent" | "youtube" | "http" | "local";
  sourceUrn: string; // magnet, url, file
  status: DownloadStatus;
  progress?: Progress;
  errorState?: string;
}

export interface DownloaderEvents {
  started: (job: DownloadJob) => void;
  progress: (job: DownloadJob, progress: Progress) => void;
  completed: (job: DownloadJob) => void;
  paused: (job: DownloadJob) => void;
  resumed: (job: DownloadJob) => void;
  canceled: (job: DownloadJob) => void;
  error: (error: Error, job: DownloadJob) => void;
}

export interface Downloader {
  start(job: DownloadJob): Promise<void>;
  pause(jobId: UUID): Promise<void>;
  resume(jobId: UUID): Promise<void>;
  cancel(jobId: UUID): Promise<void>;
  getStatus(jobId: UUID): Promise<DownloadJob | null>;
  shutdown?(): Promise<void>;
  
  // EventEmitter interface
  on<K extends keyof DownloaderEvents>(event: K, listener: DownloaderEvents[K]): this;
  emit<K extends keyof DownloaderEvents>(event: K, ...args: Parameters<DownloaderEvents[K]>): boolean;
}

export class MockDownloader extends EventEmitter implements Downloader {
  private jobs = new Map<UUID, DownloadJob>();

  async start(job: DownloadJob) {
    job.status = "active";
    job.progress = { percent: 0, bytesDownloaded: 0 };
    this.jobs.set(job.id, job);
    this.emit("started", job);

    // simulate progress
    const interval = setInterval(() => {
      const j = this.jobs.get(job.id)!;
      if (!j) return;
      if (j.progress!.percent >= 100) {
        j.status = "completed";
        this.emit("progress", j, j.progress);
        this.emit("completed", j);
        clearInterval(interval);
        return;
      }
      j.progress!.percent += 20;
      j.progress!.bytesDownloaded += 1024 * 50;
      this.emit("progress", j, j.progress);
    }, 100);
  }

  async pause(jobId: UUID) {
    const j = this.jobs.get(jobId);
    if (!j) throw new Error("job not found");
    j.status = "paused";
    this.emit("paused", j);
  }

  async resume(jobId: UUID) {
    const j = this.jobs.get(jobId);
    if (!j) throw new Error("job not found");
    j.status = "active";
    this.emit("resumed", j);
  }

  async cancel(jobId: UUID) {
    const j = this.jobs.get(jobId);
    if (!j) throw new Error("job not found");
    j.status = "canceled";
    this.emit("canceled", j);
    this.jobs.delete(jobId);
  }

  async getStatus(jobId: UUID) {
    return this.jobs.get(jobId) ?? null;
  }
}

// Downloader factory
export type DownloaderType = 'webtorrent' | 'aria2' | 'mock';

export async function createDownloader(type: DownloaderType = 'webtorrent', options: any = {}): Promise<Downloader> {
  switch (type) {
    case 'webtorrent': {
      const { WebTorrentDownloader } = await import('./webtorrent-downloader');
      return new WebTorrentDownloader(options);
    }
    case 'aria2': {
      const { Aria2Downloader } = await import('./aria2-downloader');
      return new Aria2Downloader(options);
    }
    case 'mock':
      return new MockDownloader();
    default:
      throw new Error(`Unknown downloader type: ${type}`);
  }
}

// Keep previous exports; WebTorrent driver implemented in separate file
