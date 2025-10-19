/**
 * API Service Layer for ChillyMovies Frontend
 * Provides typed wrappers for all backend endpoints with error handling and retry logic
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// Response types matching backend ApiResponse interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Metadata types
export interface MediaMetadata {
  id?: number | string;
  title: string;
  overview?: string;
  year?: number;
  poster?: string;
  backdrop?: string;
  voteAverage?: number;
  releaseDate?: string;
  mediaType?: "movie" | "tv";
}

export interface TrailerInfo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  publishedAt: string;
}

export interface TVEpisode {
  id: number;
  name: string;
  overview: string;
  episodeNumber: number;
  seasonNumber: number;
  airDate?: string;
  runtime?: number;
  stillPath?: string;
  voteAverage?: number;
}

export interface TVSeason {
  id: number;
  name: string;
  overview: string;
  seasonNumber: number;
  episodeCount: number;
  airDate?: string;
  posterPath?: string;
  episodes?: TVEpisode[];
}

// Download types
export interface DownloadJob {
  id: string;
  sourceType: "torrent" | "youtube" | "local";
  sourceUrn: string;
  progress: number;
  speed?: number;
  eta?: number;
  status: "queued" | "active" | "paused" | "completed" | "error";
  peers?: number;
  errorState?: string;
}

export interface DownloadStartPayload {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  sourceUrn?: string; // Optional magnet link or URL
  quality?: string;
  seasonNumber?: number;  // For TV episodes
  episodeNumber?: number; // For TV episodes
}

// Library types
export interface LibraryItem {
  id: string;
  title: string;
  metadata: any;
  createdAt: string;
}

// SSE Event types
export interface DownloadProgressEvent {
  downloadId: string;
  progress: number;
  speed?: number;
  eta?: number;
  status?: string;
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      throw new ApiError(
        data.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        data
      );
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or parsing errors
    throw new ApiError(
      error instanceof Error ? error.message : "Network request failed",
      undefined,
      error
    );
  }
}

/**
 * Metadata API
 */
export const metadataApi = {
  /**
   * Search for movies/TV shows by title
   */
  async search(query: string): Promise<MediaMetadata[]> {
    return apiFetch<MediaMetadata[]>(`/metadata/search?q=${encodeURIComponent(query)}`);
  },

  /**
   * Get movie or TV show details by TMDB ID
   */
  async getDetails(id: number, mediaType: "movie" | "tv"): Promise<MediaMetadata> {
    return apiFetch<MediaMetadata>(`/metadata/${mediaType}/${id}`);
  },

  /**
   * Get trailers for a movie or TV show
   */
  async getTrailers(id: number, mediaType: "movie" | "tv"): Promise<TrailerInfo[]> {
    return apiFetch<TrailerInfo[]>(`/metadata/${mediaType}/${id}/trailers`);
  },

  /**
   * Get popular movies or TV shows
   */
  async getPopular(mediaType: "movie" | "tv" = "movie", page: number = 1): Promise<MediaMetadata[]> {
    return apiFetch<MediaMetadata[]>(`/metadata/popular?mediaType=${mediaType}&page=${page}`);
  },

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    return apiFetch<any>("/metadata/cache/stats");
  },

  /**
   * Clear metadata cache
   */
  async clearCache(): Promise<{ message: string }> {
    return apiFetch<{ message: string }>("/metadata/cache/clear", {
      method: "POST",
    });
  },

  /**
   * Get TV show seasons
   */
  async getTVSeasons(id: number): Promise<TVSeason[]> {
    return apiFetch<TVSeason[]>(`/metadata/tv/${id}/seasons`);
  },

  /**
   * Get detailed information for a specific TV season including episodes
   */
  async getTVSeasonDetails(id: number, seasonNumber: number): Promise<TVSeason> {
    return apiFetch<TVSeason>(`/metadata/tv/${id}/season/${seasonNumber}`);
  },
};

/**
 * Download API
 */
export const downloadApi = {
  /**
   * Start a new download
   */
  async start(payload: DownloadStartPayload): Promise<{ id: string; status: string }> {
    return apiFetch<{ id: string; status: string }>("/download/start", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Pause a download
   */
  async pause(id: string): Promise<{ status: string }> {
    return apiFetch<{ status: string }>("/download/pause", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
  },

  /**
   * Resume a download
   */
  async resume(id: string): Promise<{ status: string }> {
    return apiFetch<{ status: string }>("/download/resume", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
  },

  /**
   * Cancel a download
   */
  async cancel(id: string): Promise<{ status: string }> {
    return apiFetch<{ status: string }>("/download/cancel", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
  },

  /**
   * Get download status
   */
  async getStatus(id: string): Promise<DownloadJob> {
    return apiFetch<DownloadJob>(`/download/status/${id}`);
  },

  /**
   * Get incomplete downloads
   */
  async getIncomplete(): Promise<DownloadJob[]> {
    return apiFetch<DownloadJob[]>("/download/incomplete");
  },

  /**
   * Create SSE connection for download progress
   * Returns EventSource that emits progress events
   */
  createProgressStream(id: string): EventSource {
    const url = `${API_BASE_URL}/events/${id}`;
    return new EventSource(url);
  },
};

/**
 * Library API
 */
export const libraryApi = {
  /**
   * Get all library items
   */
  async getAll(): Promise<{ items: LibraryItem[]; count: number }> {
    return apiFetch<{ items: LibraryItem[]; count: number }>("/library");
  },

  /**
   * Validate library integrity
   */
  async validate(): Promise<any> {
    return apiFetch<any>("/library/validate");
  },

  /**
   * Get missing media files
   */
  async getMissing(): Promise<any> {
    return apiFetch<any>("/library/missing");
  },

  /**
   * Get subtitles for media
   */
  async getSubtitles(mediaId: string): Promise<any> {
    return apiFetch<any>(`/library/${mediaId}/subtitles`);
  },

  /**
   * Detect subtitle files for media
   */
  async detectSubtitles(mediaId: string): Promise<any> {
    return apiFetch<any>(`/library/${mediaId}/subtitles/detect`);
  },
};

/**
 * Torrent API
 */
export const torrentApi = {
  /**
   * Search for torrents
   */
  async search(
    query: string,
    options?: {
      limit?: number;
      quality?: string[];
      minSeeders?: number;
      providers?: string[];
    }
  ): Promise<any> {
    const params = new URLSearchParams({ q: query });
    
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.quality) params.append("quality", options.quality.join(","));
    if (options?.minSeeders) params.append("minSeeders", options.minSeeders.toString());
    if (options?.providers) params.append("providers", options.providers.join(","));

    return apiFetch<any>(`/torrents/search?${params.toString()}`);
  },

  /**
   * Get available torrent providers
   */
  async getProviders(): Promise<any> {
    return apiFetch<any>("/torrents/providers");
  },

  /**
   * Clear torrent cache
   */
  async clearCache(): Promise<{ message: string }> {
    return apiFetch<{ message: string }>("/torrents/cache/clear", {
      method: "POST",
    });
  },
};

/**
 * Utility function to handle SSE reconnection with exponential backoff
 */
export function createResilientEventSource(
  url: string,
  onMessage: (event: MessageEvent) => void,
  onError?: (error: Event) => void,
  maxRetries: number = 5
): { close: () => void } {
  let eventSource: EventSource | null = null;
  let retryCount = 0;
  let retryTimeout: number | null = null;
  let isClosed = false;

  const connect = () => {
    if (isClosed) return;

    eventSource = new EventSource(url);

    eventSource.onmessage = onMessage;

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      
      if (eventSource) {
        eventSource.close();
      }

      if (onError) {
        onError(error);
      }

      // Exponential backoff retry
      if (retryCount < maxRetries && !isClosed) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        console.log(`Retrying SSE connection in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        retryTimeout = window.setTimeout(() => {
          retryCount++;
          connect();
        }, delay);
      } else if (retryCount >= maxRetries) {
        console.error("Max SSE retry attempts reached");
      }
    };

    eventSource.onopen = () => {
      console.log("SSE connection established");
      retryCount = 0; // Reset retry count on successful connection
    };
  };

  connect();

  return {
    close: () => {
      isClosed = true;
      if (retryTimeout !== null) {
        clearTimeout(retryTimeout);
      }
      if (eventSource) {
        eventSource.close();
      }
    },
  };
}

/**
 * Debounce utility for search
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;

  return (...args: Parameters<T>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = window.setTimeout(() => {
      func(...args);
    }, wait);
  };
}
