export interface StartDownloadRequest {
  // Legacy format (still supported)
  id?: string;
  sourceType?: "torrent" | "youtube" | "http" | "local";
  sourceUrn?: string;
  
  // New metadata-based format
  tmdbId?: number;
  mediaType?: "movie" | "tv";
  title?: string;
  quality?: string;  // e.g., "1080p", "720p"
  
  // TV Series specific fields
  seasonNumber?: number;  // For TV episodes/seasons
  episodeNumber?: number; // For specific episode
  
  // Batch download options
  batchDownload?: {
    fullSeason?: boolean;  // Download entire season
    episodes?: Array<{ seasonNumber: number; episodeNumber: number }>;  // Specific episodes
    mode?: 'sequential' | 'parallel';  // Download mode
  };
  
  // File selection for season packs
  fileSelection?: {
    fileIndices?: number[];  // Specific file indices to download
    filePatterns?: string[];  // File name patterns
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StatusResponse {
  id: string;
  status: string;
  progress?: { percent: number; bytesDownloaded: number };
}

export interface TVSeasonResponse {
  id: number;
  name: string;
  seasonNumber: number;
  episodeCount: number;
  airDate?: string;
  posterPath?: string;
  overview: string;
}

export interface TVEpisodeResponse {
  id: number;
  name: string;
  episodeNumber: number;
  seasonNumber: number;
  overview: string;
  airDate?: string;
  runtime?: number;
  stillPath?: string;
  voteAverage?: number;
}

export interface TVSeasonDetailsResponse extends TVSeasonResponse {
  episodes: TVEpisodeResponse[];
}

export interface BatchDownloadStatusResponse {
  batchId: string;
  totalEpisodes: number;
  completedEpisodes: number;
  failedEpisodes: number;
  activeDownloads: string[];  // Download job IDs
  status: 'queued' | 'active' | 'completed' | 'partial' | 'failed';
}
