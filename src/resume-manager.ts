import { StorageManager } from "./storage";
import { DownloadJob } from "./downloader";
import fs from "fs";
import path from "path";

export interface ResumeData {
  id: string;
  sourceType: "torrent" | "youtube" | "http" | "local";
  sourceUrn: string;
  status: "active" | "paused";
  progress?: {
    percent: number;
    bytesDownloaded: number;
  };
  savedAt: string;
}

export class ResumeManager {
  private storage: StorageManager;
  private resumeFilePath: string;

  constructor(storage: StorageManager, dataDir?: string) {
    this.storage = storage;
    const dir = dataDir ?? path.resolve(process.cwd(), "test-data", "resume");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.resumeFilePath = path.join(dir, "downloads.json");
  }

  /**
   * Save download state for resume capability
   */
  saveDownloadState(job: DownloadJob) {
    const resumeData: ResumeData[] = this.loadResumeData();
    
    // Remove existing entry for this job if present
    const filtered = resumeData.filter(d => d.id !== job.id);
    
    // Only save if download is active or paused (not completed, failed, or canceled)
    if (job.status === "active" || job.status === "paused") {
      filtered.push({
        id: job.id,
        sourceType: job.sourceType,
        sourceUrn: job.sourceUrn,
        status: job.status,
        progress: job.progress,
        savedAt: new Date().toISOString(),
      });
    }
    
    fs.writeFileSync(this.resumeFilePath, JSON.stringify(filtered, null, 2));
  }

  /**
   * Load incomplete downloads on startup
   */
  loadIncompleteDownloads(): ResumeData[] {
    const resumeData = this.loadResumeData();
    
    // Filter to only return downloads that were active or paused
    return resumeData.filter(d => d.status === "active" || d.status === "paused");
  }

  /**
   * Remove download from resume data (called on completion or cancellation)
   */
  removeDownload(jobId: string) {
    const resumeData = this.loadResumeData();
    const filtered = resumeData.filter(d => d.id !== jobId);
    fs.writeFileSync(this.resumeFilePath, JSON.stringify(filtered, null, 2));
  }

  /**
   * Clear all resume data (useful for cleanup tasks)
   */
  clearAll() {
    if (fs.existsSync(this.resumeFilePath)) {
      fs.unlinkSync(this.resumeFilePath);
    }
  }

  /**
   * Get resume data for a specific download
   */
  getResumeData(jobId: string): ResumeData | null {
    const resumeData = this.loadResumeData();
    return resumeData.find(d => d.id === jobId) ?? null;
  }

  /**
   * Internal helper to load resume data from file
   */
  private loadResumeData(): ResumeData[] {
    if (!fs.existsSync(this.resumeFilePath)) {
      return [];
    }
    
    try {
      const content = fs.readFileSync(this.resumeFilePath, "utf8");
      return JSON.parse(content);
    } catch (err) {
      console.error("Failed to load resume data:", err);
      return [];
    }
  }

  /**
   * Clean up stale resume data older than specified days
   */
  cleanupStaleData(daysOld: number = 30) {
    const resumeData = this.loadResumeData();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const filtered = resumeData.filter(d => {
      const savedDate = new Date(d.savedAt);
      return savedDate > cutoffDate;
    });
    
    if (filtered.length < resumeData.length) {
      fs.writeFileSync(this.resumeFilePath, JSON.stringify(filtered, null, 2));
      console.log(`Cleaned up ${resumeData.length - filtered.length} stale resume entries`);
    }
  }
}
