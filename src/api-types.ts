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
  
  // Optional fields
  seasonNumber?: number;  // For TV episodes
  episodeNumber?: number; // For TV episodes
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
