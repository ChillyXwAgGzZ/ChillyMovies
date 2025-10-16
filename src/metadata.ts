import fetch from "node-fetch";
import { withRetry } from "./retry";

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

export interface MetadataFetcher {
  fetchByTMDBId(tmdbId: number, mediaType?: "movie" | "tv"): Promise<MediaMetadata | null>;
  searchByTitle(title: string): Promise<MediaMetadata[]>;
}

export class TMDBMetadataFetcher implements MetadataFetcher {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    // If apiKey is explicitly provided (even empty string), use it; otherwise fall back to env
    this.apiKey = apiKey !== undefined ? apiKey : (process.env.TMDB_API_KEY || "");
    this.baseUrl = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
    
    if (!this.apiKey) {
      console.warn("TMDB_API_KEY not set. Metadata fetching will fail. Please set it in .env file.");
    }
  }

  async fetchByTMDBId(tmdbId: number, mediaType: "movie" | "tv" = "movie"): Promise<MediaMetadata | null> {
    if (!this.apiKey) {
      throw new Error("TMDB API key not configured");
    }

    return withRetry(async () => {
      const url = `${this.baseUrl}/${mediaType}/${tmdbId}?api_key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) return null;
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
  }

  async searchByTitle(title: string): Promise<MediaMetadata[]> {
    if (!this.apiKey) {
      throw new Error("TMDB API key not configured");
    }

    return withRetry(async () => {
      const url = `${this.baseUrl}/search/multi?api_key=${this.apiKey}&query=${encodeURIComponent(title)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
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
    }, { retries: 2 });
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
}
