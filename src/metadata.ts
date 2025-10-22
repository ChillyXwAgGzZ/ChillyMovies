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
  genreIds?: number[]; // TMDB genre IDs
  
  // Extended metadata (Phase 3)
  runtime?: number; // In minutes
  status?: string; // "Released", "Returning Series", "Ended", etc.
  budget?: number; // In USD
  revenue?: number; // In USD
  tagline?: string;
  originalLanguage?: string;
  
  // Production information
  productionCompanies?: Array<{
    id: number;
    name: string;
    logoPath?: string;
  }>;
  
  // Networks (TV only)
  networks?: Array<{
    id: number;
    name: string;
    logoPath?: string;
  }>;
  
  // Genres (full objects)
  genres?: Array<{
    id: number;
    name: string;
  }>;
  
  // TV-specific fields
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  episodeRuntime?: number[];
  lastAirDate?: string;
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

export interface MetadataFetcher {
  fetchByTMDBId(tmdbId: number, mediaType?: "movie" | "tv"): Promise<MediaMetadata | null>;
  searchByTitle(title: string): Promise<MediaMetadata[]>;
  fetchTrailers(tmdbId: number, mediaType?: "movie" | "tv"): Promise<TrailerInfo[]>;
  fetchSimilar?(tmdbId: number, mediaType?: "movie" | "tv"): Promise<MediaMetadata[]>;
  fetchTVSeasons?(tmdbId: number): Promise<TVSeason[]>;
  fetchTVSeasonDetails?(tmdbId: number, seasonNumber: number): Promise<TVSeason | null>;
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
  private cache: Cache<MediaMetadata | MediaMetadata[] | TrailerInfo[] | TVSeason[] | TVSeason> | null = null;
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
        
        // Extended metadata (Phase 3)
        runtime: data.runtime,
        status: data.status,
        budget: data.budget,
        revenue: data.revenue,
        tagline: data.tagline,
        originalLanguage: data.original_language,
        
        // Production companies (movies and TV)
        productionCompanies: (data.production_companies || []).map((company: any) => ({
          id: company.id,
          name: company.name,
          logoPath: company.logo_path ? `https://image.tmdb.org/t/p/w200${company.logo_path}` : undefined,
        })),
        
        // Networks (TV only)
        networks: mediaType === "tv" && data.networks ? (data.networks || []).map((network: any) => ({
          id: network.id,
          name: network.name,
          logoPath: network.logo_path ? `https://image.tmdb.org/t/p/w200${network.logo_path}` : undefined,
        })) : undefined,
        
        // Genres (full objects with names)
        genres: (data.genres || []).map((genre: any) => ({
          id: genre.id,
          name: genre.name,
        })),
        
        // TV-specific fields
        numberOfSeasons: mediaType === "tv" ? data.number_of_seasons : undefined,
        numberOfEpisodes: mediaType === "tv" ? data.number_of_episodes : undefined,
        episodeRuntime: mediaType === "tv" ? data.episode_run_time : undefined,
        lastAirDate: mediaType === "tv" ? data.last_air_date : undefined,
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
   * Fetch similar movies or TV shows from TMDB
   */
  async fetchSimilar(tmdbId: number, mediaType: "movie" | "tv" = "movie"): Promise<MediaMetadata[]> {
    await this.ensureApiKey();
    
    if (!this.apiKey) {
      throw new Error("TMDB API key not configured");
    }

    // Check cache first
    const cacheKey = createCacheKey("tmdb", "similar", mediaType, tmdbId);
    if (this.cache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached as MediaMetadata[];
      }
    }

    const results = await withRetry(async () => {
      const url = `${this.baseUrl}/${mediaType}/${tmdbId}/similar?api_key=${this.apiKey}&page=1`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) return [];
        if (response.status === 429) {
          throw new Error("TMDB API rate limit exceeded. Please try again later.");
        }
        throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();
      
      return (data.results || [])
        .slice(0, 12) // Limit to 12 similar items
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
          mediaType,
          genreIds: item.genre_ids || [],
        }));
    }, { retries: 2 });

    // Cache the results for 30 minutes (similar content doesn't change often)
    if (this.cache && results.length > 0) {
      this.cache.set(cacheKey, results, 1800000); // 30 minutes
    }

    return results;
  }

  /**
   * Fetch TV show seasons (without episode details)
   */
  async fetchTVSeasons(tmdbId: number): Promise<TVSeason[]> {
    await this.ensureApiKey();
    
    if (!this.apiKey) {
      throw new Error("TMDB API key not configured");
    }

    // Check cache first
    const cacheKey = createCacheKey("tmdb", "seasons", tmdbId);
    if (this.cache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached as TVSeason[];
      }
    }

    const results = await withRetry(async () => {
      const url = `${this.baseUrl}/tv/${tmdbId}?api_key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) return [];
        if (response.status === 429) {
          throw new Error("TMDB API rate limit exceeded. Please try again later.");
        }
        throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();
      
      // Extract seasons from TV show details
      const seasons = (data.seasons || [])
        .map((season: any) => ({
          id: season.id,
          name: season.name,
          overview: season.overview || "",
          seasonNumber: season.season_number,
          episodeCount: season.episode_count,
          airDate: season.air_date,
          posterPath: season.poster_path ? `https://image.tmdb.org/t/p/w500${season.poster_path}` : undefined,
        }));

      return seasons;
    }, { retries: 2 });

    // Cache the results for 6 hours (season data doesn't change often)
    if (this.cache && results.length > 0) {
      this.cache.set(cacheKey, results, 21600000); // 6 hours
    }

    return results;
  }

  /**
   * Fetch detailed information for a specific season including all episodes
   */
  async fetchTVSeasonDetails(tmdbId: number, seasonNumber: number): Promise<TVSeason | null> {
    await this.ensureApiKey();
    
    if (!this.apiKey) {
      throw new Error("TMDB API key not configured");
    }

    // Check cache first
    const cacheKey = createCacheKey("tmdb", "season-details", tmdbId, seasonNumber);
    if (this.cache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached as TVSeason;
      }
    }

    const result = await withRetry(async () => {
      const url = `${this.baseUrl}/tv/${tmdbId}/season/${seasonNumber}?api_key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) return null;
        if (response.status === 429) {
          throw new Error("TMDB API rate limit exceeded. Please try again later.");
        }
        throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();
      
      const season: TVSeason = {
        id: data.id,
        name: data.name,
        overview: data.overview || "",
        seasonNumber: data.season_number,
        episodeCount: data.episodes?.length || 0,
        airDate: data.air_date,
        posterPath: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : undefined,
        episodes: (data.episodes || []).map((ep: any) => ({
          id: ep.id,
          name: ep.name,
          overview: ep.overview || "",
          episodeNumber: ep.episode_number,
          seasonNumber: ep.season_number,
          airDate: ep.air_date,
          runtime: ep.runtime,
          stillPath: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : undefined,
          voteAverage: ep.vote_average,
        })),
      };

      return season;
    }, { retries: 2 });

    // Cache the results for 6 hours
    if (this.cache && result) {
      this.cache.set(cacheKey, result, 21600000); // 6 hours
    }

    return result;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache?.getStats() || null;
  }

  /**
   * Fetch popular movies or TV shows
   */
  async fetchPopular(mediaType: "movie" | "tv" = "movie", page: number = 1): Promise<MediaMetadata[]> {
    await this.ensureApiKey();
    
    if (!this.apiKey) {
      throw new Error("TMDB API key not configured");
    }

    // Check cache first
    const cacheKey = createCacheKey("tmdb", "popular", mediaType, page);
    if (this.cache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached as MediaMetadata[];
      }
    }

    const results = await withRetry(async () => {
      const url = `${this.baseUrl}/${mediaType}/popular?api_key=${this.apiKey}&page=${page}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("TMDB API rate limit exceeded. Using cached results if available.");
        }
        throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();
      
      return (data.results || [])
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
          mediaType: mediaType,
          genreIds: item.genre_ids || [], // Include genre IDs from TMDB
        }));
    }, { 
      retries: 2
    });

    // Cache the results
    if (this.cache) {
      this.cache.set(cacheKey, results);
    }

    return results;
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
