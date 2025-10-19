/**
 * Aria2 Downloader Implementation
 * 
 * Uses aria2c as a subprocess for downloading torrents.
 * More robust than WebTorrent for handling problematic torrents.
 * 
 * Features:
 * - External aria2c process management
 * - JSON-RPC API communication
 * - Progress tracking via aria2 status
 * - Automatic process restart on failure
 * - Better error handling and retry logic
 */

import { EventEmitter } from "eventemitter3";
import { spawn, ChildProcess } from "child_process";
import { Downloader, DownloadJob } from "./downloader";
import { getLogger } from "./logger";
import { withRetry } from "./retry";
import path from "path";
import fs from "fs";
import net from "net";
import http from "http";

const logger = getLogger();

export interface Aria2DownloaderOptions {
  /** Download directory */
  downloadDir?: string;
  /** Aria2 RPC port */
  rpcPort?: number;
  /** Aria2 RPC secret */
  rpcSecret?: string;
  /** Max concurrent downloads */
  maxConcurrent?: number;
  /** Max download speed (KB/s, 0 = unlimited) */
  maxSpeed?: number;
  /** Max upload speed (KB/s, 0 = unlimited) */
  maxUploadSpeed?: number;
  /** Enable DHT */
  enableDht?: boolean;
  /** Seed time in minutes (0 = no seeding) */
  seedTime?: number;
}

interface Aria2RPCResponse {
  id: string;
  jsonrpc: string;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

interface Aria2Status {
  gid: string;
  status: 'active' | 'waiting' | 'paused' | 'error' | 'complete' | 'removed';
  totalLength: string;
  completedLength: string;
  uploadLength: string;
  downloadSpeed: string;
  uploadSpeed: string;
  connections: string;
  numSeeders?: string;
  seeder?: string;
  files: Array<{
    index: string;
    path: string;
    length: string;
    completedLength: string;
    uri: Array<{ uri: string; status: string }>;
  }>;
  errorCode?: string;
  errorMessage?: string;
}

export class Aria2Downloader extends EventEmitter implements Downloader {
  private process: ChildProcess | null = null;
  private jobs = new Map<string, { gid: string; job: DownloadJob }>();
  private gidToJobId = new Map<string, string>();
  private options: Required<Aria2DownloaderOptions>;
  private rpcId = 1;
  private statusInterval: NodeJS.Timeout | null = null;
  private isStarting = false;
  private isShuttingDown = false;

  constructor(options: Aria2DownloaderOptions = {}) {
    super();
    
    this.options = {
      downloadDir: options.downloadDir || path.resolve(process.cwd(), "media"),
      rpcPort: options.rpcPort || 6800,
      rpcSecret: options.rpcSecret || "chillymovies",
      maxConcurrent: options.maxConcurrent || 3,
      maxSpeed: options.maxSpeed || 0,
      maxUploadSpeed: options.maxUploadSpeed || 100, // Limit upload to 100 KB/s by default
      enableDht: options.enableDht !== false,
      seedTime: options.seedTime || 5, // Seed for 5 minutes by default
    };

    // Ensure download directory exists
    if (!fs.existsSync(this.options.downloadDir)) {
      fs.mkdirSync(this.options.downloadDir, { recursive: true });
    }

    // Start aria2 process and status monitoring
    this.initializeAria2();
  }

  private async initializeAria2(): Promise<void> {
    if (this.isStarting || this.isShuttingDown) return;
    this.isStarting = true;

    try {
      await this.startAria2Process();
      await this.waitForAria2Ready();
      this.startStatusMonitoring();
      logger.info('Aria2 downloader initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Aria2 downloader', error as Error);
      throw error;
    } finally {
      this.isStarting = false;
    }
  }

  private async startAria2Process(): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '--enable-rpc=true',
        `--rpc-listen-port=${this.options.rpcPort}`,
        `--rpc-secret=${this.options.rpcSecret}`,
        '--rpc-allow-origin-all=true',
        `--dir=${this.options.downloadDir}`,
        `--max-concurrent-downloads=${this.options.maxConcurrent}`,
        '--continue=true',
        '--max-connection-per-server=16',
        '--min-split-size=1M',
        '--split=16',
        '--file-allocation=prealloc',
        '--check-integrity=true',
      ];

      if (this.options.maxSpeed > 0) {
        args.push(`--max-overall-download-limit=${this.options.maxSpeed}K`);
      }

      if (this.options.maxUploadSpeed > 0) {
        args.push(`--max-overall-upload-limit=${this.options.maxUploadSpeed}K`);
      }

      if (this.options.enableDht) {
        args.push('--enable-dht=true', '--bt-enable-lpd=true', '--bt-enable-hook-after-hash-check=true');
      }

      if (this.options.seedTime > 0) {
        args.push(`--seed-time=${this.options.seedTime}`);
      } else {
        args.push('--seed-time=0');
      }

      logger.info('Starting aria2c process', { args });

      this.process = spawn('aria2c', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      });

      this.process.stdout?.on('data', (data) => {
        logger.debug('aria2c stdout', { output: data.toString() });
      });

      this.process.stderr?.on('data', (data) => {
        const output = data.toString();
        if (!output.includes('INFO') && !output.includes('NOTICE')) {
          logger.warn('aria2c stderr', { output });
        }
      });

      this.process.on('error', (error) => {
        logger.error('aria2c process error', error);
        reject(error);
      });

      this.process.on('exit', (code, signal) => {
        logger.warn('aria2c process exited', { code, signal });
        this.process = null;
        
        if (!this.isShuttingDown) {
          // Restart process if it wasn't intentionally stopped
          setTimeout(() => {
            if (!this.isShuttingDown) {
              logger.info('Restarting aria2c process');
              this.initializeAria2().catch(error => {
                logger.error('Failed to restart aria2c', error);
              });
            }
          }, 5000);
        }
      });

      // Give process time to start
      setTimeout(() => resolve(), 2000);
    });
  }

  private async waitForAria2Ready(): Promise<void> {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        await this.rpcCall('aria2.getVersion', []);
        logger.info('Aria2 RPC is ready');
        return;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error(`Aria2 RPC not ready after ${maxAttempts} attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  private startStatusMonitoring(): void {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }

    this.statusInterval = setInterval(async () => {
      try {
        await this.updateAllJobStatuses();
      } catch (error) {
        logger.error('Status monitoring error', error as Error);
      }
    }, 2000); // Update every 2 seconds
  }

  private async updateAllJobStatuses(): Promise<void> {
    for (const [jobId, { gid, job }] of this.jobs.entries()) {
      try {
        const status = await this.getAria2Status(gid);
        if (status) {
          this.updateJobFromAria2Status(job, status);
        }
      } catch (error) {
        logger.error(`Failed to get status for job ${jobId}`, error as Error);
      }
    }
  }

  private updateJobFromAria2Status(job: DownloadJob, status: Aria2Status): void {
    const totalLength = parseInt(status.totalLength) || 1;
    const completedLength = parseInt(status.completedLength) || 0;
    const progress = Math.min(100, Math.round((completedLength / totalLength) * 100));

    job.progress = {
      percent: progress,
      bytesDownloaded: completedLength,
    };

    // Update job status
    const oldStatus = job.status;
    switch (status.status) {
      case 'active':
        job.status = 'active';
        break;
      case 'waiting':
        job.status = 'queued';
        break;
      case 'paused':
        job.status = 'paused';
        break;
      case 'complete':
        job.status = 'completed';
        break;
      case 'error':
        job.status = 'failed';
        job.errorState = status.errorMessage || `Error code: ${status.errorCode}`;
        break;
      case 'removed':
        job.status = 'canceled';
        break;
    }

    // Emit events for status changes
    if (oldStatus !== job.status) {
      switch (job.status) {
        case 'active':
          this.emit('started', job);
          break;
        case 'completed':
          this.emit('completed', job);
          break;
        case 'failed':
          this.emit('error', new Error(job.errorState || 'Download failed'), job);
          break;
        case 'canceled':
          this.emit('canceled', job);
          break;
        case 'paused':
          this.emit('paused', job);
          break;
      }
    }

    // Always emit progress
    this.emit('progress', job, job.progress);
  }

  async start(job: DownloadJob): Promise<void> {
    if (job.sourceType !== "torrent") {
      throw new Error("Aria2Downloader only supports torrent sources");
    }

    try {
      const options: any = {
        dir: this.options.downloadDir,
        'bt-metadata-only': 'false',
        'bt-save-metadata': 'true',
        'follow-torrent': 'true',
      };

      // Handle file selection for multi-file torrents (e.g., season packs)
      if (job.fileSelection?.fileIndices && job.fileSelection.fileIndices.length > 0) {
        // Select specific files by index (1-based in aria2)
        const indices = job.fileSelection.fileIndices.map(i => i + 1).join(',');
        options['select-file'] = indices;
        logger.info(`Selecting files by index for download`, { jobId: job.id, indices });
      }

      const gid = await this.rpcCall('aria2.addUri', [
        [job.sourceUrn],
        options
      ]);

      this.jobs.set(job.id, { gid, job });
      this.gidToJobId.set(gid, job.id);

      job.status = "queued";
      logger.info(`Started download with aria2`, { jobId: job.id, gid });

    } catch (error) {
      logger.error('Failed to start download', error as Error, { jobId: job.id });
      throw error;
    }
  }

  /**
   * List files in a torrent without starting the download
   * Useful for season packs to let users select which episodes to download
   */
  async listFiles(sourceUrn: string): Promise<Array<{ index: number; path: string; size: number }>> {
    try {
      // Add torrent in metadata-only mode to fetch file list
      const gid = await this.rpcCall('aria2.addUri', [
        [sourceUrn],
        {
          'bt-metadata-only': 'true',
          'bt-save-metadata': 'false',
        }
      ]);

      // Wait for metadata to be fetched
      let attempts = 0;
      const maxAttempts = 30;
      
      while (attempts < maxAttempts) {
        const status = await this.getAria2Status(gid);
        
        if (status && status.files && status.files.length > 0) {
          // Remove the metadata-only download
          try {
            await this.rpcCall('aria2.forceRemove', [gid]);
          } catch {
            // Ignore errors when removing
          }

          return status.files.map((file, index) => ({
            index,
            path: file.path,
            size: parseInt(file.length),
          }));
        }

        if (status?.status === 'complete' || status?.status === 'error') {
          break;
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Clean up if we didn't get file list
      try {
        await this.rpcCall('aria2.forceRemove', [gid]);
      } catch {
        // Ignore errors
      }

      throw new Error('Failed to fetch torrent file list - timeout or metadata unavailable');

    } catch (error) {
      logger.error('Failed to list torrent files', error as Error);
      throw error;
    }
  }

  async pause(jobId: string): Promise<void> {
    const entry = this.jobs.get(jobId);
    if (!entry) throw new Error("Job not found");

    try {
      await this.rpcCall('aria2.pause', [entry.gid]);
      entry.job.status = "paused";
      this.emit('paused', entry.job);
    } catch (error) {
      logger.error('Failed to pause download', error as Error, { jobId });
      throw error;
    }
  }

  async resume(jobId: string): Promise<void> {
    const entry = this.jobs.get(jobId);
    if (!entry) throw new Error("Job not found");

    try {
      await this.rpcCall('aria2.unpause', [entry.gid]);
      entry.job.status = "active";
      this.emit('resumed', entry.job);
    } catch (error) {
      logger.error('Failed to resume download', error as Error, { jobId });
      throw error;
    }
  }

  async cancel(jobId: string): Promise<void> {
    const entry = this.jobs.get(jobId);
    if (!entry) throw new Error("Job not found");

    try {
      // Try to remove active download first, then force remove
      try {
        await this.rpcCall('aria2.remove', [entry.gid]);
      } catch {
        await this.rpcCall('aria2.forceRemove', [entry.gid]);
      }

      entry.job.status = "canceled";
      this.jobs.delete(jobId);
      this.gidToJobId.delete(entry.gid);
      this.emit('canceled', entry.job);
    } catch (error) {
      logger.error('Failed to cancel download', error as Error, { jobId });
      throw error;
    }
  }

  async getStatus(jobId: string): Promise<DownloadJob | null> {
    const entry = this.jobs.get(jobId);
    return entry ? entry.job : null;
  }

  private async getAria2Status(gid: string): Promise<Aria2Status | null> {
    try {
      return await this.rpcCall('aria2.tellStatus', [gid]);
    } catch (error) {
      return null;
    }
  }

  private async rpcCall(method: string, params: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = (this.rpcId++).toString();
      const payload = {
        jsonrpc: '2.0',
        id,
        method,
        params: [`token:${this.options.rpcSecret}`, ...params],
      };

      const postData = JSON.stringify(payload);
      const options = {
        hostname: 'localhost',
        port: this.options.rpcPort,
        path: '/jsonrpc',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response: Aria2RPCResponse = JSON.parse(data);
            if (response.error) {
              reject(new Error(`Aria2 RPC error: ${response.error.message}`));
            } else {
              resolve(response.result);
            }
          } catch (error) {
            reject(new Error(`Invalid JSON response: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();

      // Timeout after 10 seconds
      setTimeout(() => {
        req.destroy();
        reject(new Error('RPC call timeout'));
      }, 10000);
    });
  }

  async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    if (this.statusInterval) {
      clearInterval(this.statusInterval);
      this.statusInterval = null;
    }

    // Gracefully shutdown aria2
    if (this.process) {
      try {
        await this.rpcCall('aria2.shutdown', []);
      } catch {
        // Force kill if graceful shutdown fails
        this.process.kill('SIGTERM');
      }

      // Wait for process to exit
      await new Promise<void>(resolve => {
        if (!this.process) {
          resolve();
          return;
        }

        const timeout = setTimeout(() => {
          if (this.process) {
            this.process.kill('SIGKILL');
          }
          resolve();
        }, 5000);

        this.process.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      this.process = null;
    }

    logger.info('Aria2 downloader shutdown complete');
  }
}