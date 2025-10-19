export type UUID = string;

export interface Progress {
  percent: number;
  bytesDownloaded: number;
  speedBytesPerSec?: number;
}

/**
 * TV Episode selection for batch downloads
 */
export interface EpisodeSelection {
  seasonNumber: number;
  episodeNumber: number;
}

/**
 * File selection criteria for torrents with multiple files
 * Used primarily for TV season packs where only specific episodes are needed
 */
export interface FileSelection {
  /** File indices to download (0-based) */
  fileIndices?: number[];
  /** File paths or patterns to download */
  filePatterns?: string[];
  /** Episode selections (will be matched against filenames) */
  episodes?: EpisodeSelection[];
}

/**
 * Batch download configuration
 */
export interface BatchDownloadOptions {
  /** Download entire season */
  fullSeason?: boolean;
  /** Specific episodes to download */
  episodes?: EpisodeSelection[];
  /** Download mode: 'sequential' or 'parallel' */
  mode?: 'sequential' | 'parallel';
  /** Max concurrent downloads for parallel mode */
  maxConcurrent?: number;
}
