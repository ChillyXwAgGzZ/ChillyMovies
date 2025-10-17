import fetch from "node-fetch";
import { withRetry } from "./retry";
import { Cache, createCacheKey } from "./cache";
import { getTMDBApiKey } from "./secrets";
import path from "path";

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
  key: string; // YouTube video key
  name: string;
  site: string; // "YouTube"
  type: string; // "Trailer", "Teaser", etc.
  official: boolean;
  publishedAt: string;
}

export interface MetadataFetcher {
  fetchByTMDBId(tmdbId: number, mediaType?: "movie" | "tv"): Promise<MediaMetadata | null>;
  searchByTitle(title: string): Promise<MediaMetadata[]>;
  fetchTrailers(tmdbId: number, mediaType?: "movie" | "tv"): Promise<TrailerInfo[]>;
}

export interface TMDBFetcherOptions {
  apiKey?: string;
  enableCache?: boolean;
  cacheTTL?: number;
  cachePath?: string;
}

export class TMDBMetadataFetcher implements MetadataFetcher {
  private apiKey: string;
  private baseUrl: string;
  private cache: Cache<MediaMetadata | MediaMetadata[] | TrailerInfo[]> | null = null;
  private apiKeyInitialized: boolean = false;

  constructor(options?: TMDBFetcherOptions) {
    // If apiKey is explicitly provided (even empty string), use it; otherwise will load from secure storage
    this.apiKey = options?.apiKey !== undefined ? options.apiKey : "";
    this.baseUrl = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
    
    if (options?.apiKey !== undefined) {
      this.apiKeyInitialized = true;
      if (!this.apiKey) {
        console.warn("TMDB_API_KEY not set. Metadata fetching will fail. Please set it in .env file.");
      }
    }

    // Initialize cache if enabled
    if (options?.enableCache !== false) {
      this.cache = new Cache({
        ttl: options?.cacheTTL ?? 3600000, // 1 hour default
        maxSize: 500,
        persistPath: options?.cachePath ?? path.resolve(process.cwd(), ".cache", "tmdb-cache.json"),
      });
    }
  }
  
  /**
   * Ensure API key is loaded from secure storage if not explicitly provided
   */
  private async ensureApiKey(): Promise<void> {
    if (!this.apiKeyInitialized) {
      const key = await getTMDBApiKey();
      if (key) {
        this.apiKey = key;
      }
      this.apiKeyInitialized = true;
      
      if (!this.apiKey) {
        console.warn("TMDB_API_KEY not set. Metadata fetching will fail. Please set it in .env file or secure storage.");
      }
    }
  }

  async fetchByTMDBId(tmdbId: number, mediaType: "movie" | "tv" = "movie"): Promise<MediaMetadata | null> {
    await this.ensureApiKey();
    
    if (!this.apiKey) {
      throw new Error("TMDB API key not configured");
    }

    // Check cache first
    const cacheKey = createCacheKey("tmdb", "id", mediaType, tmdbId);
    if (this.cache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached as MediaMetadata | null;
      }
    }

    const result = await withRetry(async () => {
      const url = `${this.baseUrl}/${mediaType}/${tmdbId}?api_key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) return null;
        if (response.status === 429) {
          throw new Error("TMDB API rate limit exceeded. Please try again later or configure your own API key.");
        }
        throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();
      
      return {
        id: data.id,
        title: data.title || data.name,
        overview: data.overview,
        year: data.release_date ? new Date(data.release_date).getFullYear() : 
              data.first_air_date ? new Date(data.first_air_date).getFullYear() : undefined,
        poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : undefined,
        backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : undefined,
        voteAverage: data.vote_average,
        releaseDate: data.release_date || data.first_air_date,
        mediaType,
      };
    }, { retries: 2 });

    // Cache the result
    if (this.cache && result) {
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  async searchByTitle(title: string): Promise<MediaMetadata[]> {
    await this.ensureApiKey();
    
    if (!this.apiKey) {
      throw new Error("TMDB API key not configured");
    }

    // Check cache first
    const cacheKey = createCacheKey("tmdb", "search", title.toLowerCase());
    if (this.cache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached as MediaMetadata[];
      }
    }

    const results = await withRetry(async () => {
      const url = `${this.baseUrl}/search/multi?api_key=${this.apiKey}&query=${encodeURIComponent(title)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("TMDB API rate limit exceeded. Using cached results if available.");
        }
        throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();
      
      return (data.results || [])
        .filter((item: any) => item.media_type === "movie" || item.media_type === "tv")
        .slice(0, 20) // Limit to top 20 results
        .map((item: any) => ({
          id: item.id,
          title: item.title || item.name,
          overview: item.overview,
          year: item.release_date ? new Date(item.release_date).getFullYear() : 
                item.first_air_date ? new Date(item.first_air_date).getFullYear() : undefined,
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
          backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : undefined,
          voteAverage: item.vote_average,
          releaseDate: item.release_date || item.first_air_date,
          mediaType: item.media_type,
        }));
    }, { 
      retries: 2
    });

    // Cache the results
    if (this.cache && results.length > 0) {
      this.cache.set(cacheKey, results, 1800000); // Cache searches for 30 minutes
    }

    return results;
  }

  /**
   * Fetch trailer videos for a movie or TV show from TMDB
   */
  async fetchTrailers(tmdbId: number, mediaType: "movie" | "tv" = "movie"): Promise<TrailerInfo[]> {
    await this.ensureApiKey();
    
    if (!this.apiKey) {
      throw new Error("TMDB API key not configured");
    }

    // Check cache first
    const cacheKey = createCacheKey("tmdb", "trailers", mediaType, tmdbId);
    if (this.cache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached as TrailerInfo[];
      }
    }

    const results = await withRetry(async () => {
      const url = `${this.baseUrl}/${mediaType}/${tmdbId}/videos?api_key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) return [];
        if (response.status === 429) {
          throw new Error("TMDB API rate limit exceeded. Please try again later.");
        }
        throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();
      
      // Filter for YouTube trailers and sort by official status and type
      const trailers = (data.results || [])
        .filter((video: any) => video.site === "YouTube" && (video.type === "Trailer" || video.type === "Teaser"))
        .map((video: any) => ({
          id: video.id,
          key: video.key,
          name: video.name,
          site: video.site,
          type: video.type,
          official: video.official || false,
          publishedAt: video.published_at,
        }))
        .sort((a: any, b: any) => {
          // Prioritize official trailers
          if (a.official && !b.official) return -1;
          if (!a.official && b.official) return 1;
          // Then prioritize "Trailer" over "Teaser"
          if (a.type === "Trailer" && b.type !== "Trailer") return -1;
          if (a.type !== "Trailer" && b.type === "Trailer") return 1;
          return 0;
        });

      return trailers;
    }, { retries: 2 });

    // Cache the results for 24 hours (trailers don't change often)
    if (this.cache && results.length > 0) {
      this.cache.set(cacheKey, results, 86400000); // 24 hours
    }

    return results;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache?.getStats() || null;
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache?.clear();
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown() {
    if (this.cache) {
      await this.cache.shutdown();
    }
  }
}

export class MockMetadataFetcher implements MetadataFetcher {
  async fetchByTMDBId(tmdbId: number) {
    return {
      id: tmdbId,
      title: `Mock Movie ${tmdbId}`,
      overview: "This is a mocked movie for tests",
      year: 2020,
    };
  }

  async searchByTitle(title: string) {
    return [
      { id: 1, title: `${title} (result 1)`, overview: "mock", year: 2019 },
    ];
  }

  async fetchTrailers(tmdbId: number, mediaType: "movie" | "tv" = "movie"): Promise<TrailerInfo[]> {
    return [
      {
        id: "mock-trailer-1",
        key: "dQw4w9WgXcQ",
        name: `Official Trailer`,
        site: "YouTube",
        type: "Trailer",
        official: true,
        publishedAt: "2024-01-01T00:00:00.000Z",
      },
    ];
  }
}
