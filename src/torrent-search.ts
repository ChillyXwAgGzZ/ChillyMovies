/**
 * Torrent Search Module
 * 
 * Provides unified interface for searching torrent content across multiple sources.
 * Implements pluggable provider pattern for extensibility.
 * 
 * Features:
 * - Multi-source search aggregation
 * - Quality filtering (720p, 1080p, 4K)
 * - Seeders/leechers information
 * - Magnet link extraction
 * - Rate limiting per provider
 * - Error handling and fallback
 * 
 * Supported Providers:
 * - YTS (yts.mx) - Movies optimized for size
 * - 1337x (1337x.to) - General purpose
 * - The Pirate Bay (via proxy) - Wide selection
 */

import { getLogger } from './logger';
import fetch, { RequestInit as FetchRequestInit } from 'node-fetch';

const logger = getLogger();

export interface TorrentResult {
  /** Provider-specific unique identifier */
  id: string;
  /** Content title */
  title: string;
  /** Year of release (if available) */
  year?: number;
  /** Video quality (e.g., "720p", "1080p", "2160p") */
  quality?: string;
  /** File size in bytes */
  size: number;
  /** Formatted size string (e.g., "1.4 GB") */
  sizeFormatted: string;
  /** Number of seeders */
  seeders: number;
  /** Number of leechers */
  leechers: number;
  /** Magnet link for download */
  magnetLink: string;
  /** Provider name */
  provider: string;
  /** Media type (movie, tv) */
  type: 'movie' | 'tv';
  /** TMDB ID if available */
  tmdbId?: number;
  /** Direct torrent file URL (optional) */
  torrentUrl?: string;
  /** Upload date (ISO string) */
  uploadDate?: string;
}

export interface SearchOptions {
  /** Maximum results per provider */
  limit?: number;
  /** Filter by quality */
  quality?: string[];
  /** Minimum seeders */
  minSeeders?: number;
  /** Media type filter */
  type?: 'movie' | 'tv';
  /** Providers to use (defaults to all) */
  providers?: string[];
}

export interface TorrentProvider {
  /** Provider name */
  name: string;
  /** Search for torrents */
  search(query: string, options?: SearchOptions): Promise<TorrentResult[]>;
  /** Get torrent details by ID */
  getDetails?(id: string): Promise<TorrentResult | null>;
  /** Check if provider is available */
  isAvailable(): Promise<boolean>;
}

/**
 * YTS Provider (yts.mx)
 * Optimized for movies with small file sizes
 */
class YTSProvider implements TorrentProvider {
  name = 'YTS';
  private baseUrl = 'https://yts.mx/api/v2';
  private lastRequest = 0;
  private minInterval = 1000; // 1 second between requests

  private async fetchWithTimeout(url: string, timeoutMs: number, init?: FetchRequestInit) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...(init ?? {}), signal: controller.signal } as FetchRequestInit);
    } finally {
      clearTimeout(timeout);
    }
  }

  async search(query: string, options: SearchOptions = {}): Promise<TorrentResult[]> {
    try {
      // Rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequest;
      if (timeSinceLastRequest < this.minInterval) {
        await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastRequest));
      }
      this.lastRequest = Date.now();

      const params = new URLSearchParams({
        query_term: query,
        limit: String(options.limit || 20),
      });

      if (options.quality?.length) {
        params.set('quality', options.quality[0]);
      }

      if (options.minSeeders) {
        params.set('minimum_rating', '0'); // YTS doesn't support seeder filtering directly
      }

      const url = `${this.baseUrl}/list_movies.json?${params}`;
      logger.info(`YTS search: ${query}`, { url });

      const response = await this.fetchWithTimeout(url, 10000, {
        headers: { 'User-Agent': 'ChillyMovies/1.0' },
      });

      if (!response.ok) {
        throw new Error(`YTS API error: ${response.status}`);
      }

      const data = await response.json() as any;

      if (data.status !== 'ok' || !data.data?.movies) {
        return [];
      }

      const results: TorrentResult[] = [];
      
      for (const movie of data.data.movies) {
        if (!movie.torrents || movie.torrents.length === 0) continue;

        for (const torrent of movie.torrents) {
          // Apply seeders filter
          if (options.minSeeders && torrent.seeds < options.minSeeders) {
            continue;
          }

          // Apply quality filter
          if (options.quality?.length && !options.quality.includes(torrent.quality)) {
            continue;
          }

          results.push({
            id: `yts-${movie.id}-${torrent.quality}`,
            title: `${movie.title} (${movie.year})`,
            year: movie.year,
            quality: torrent.quality,
            size: torrent.size_bytes || 0,
            sizeFormatted: torrent.size,
            seeders: torrent.seeds,
            leechers: torrent.peers,
            magnetLink: this.buildMagnetLink(torrent.hash, movie.title, movie.year),
            provider: this.name,
            type: 'movie',
            tmdbId: movie.imdb_code ? undefined : undefined, // YTS uses IMDB, not TMDB
            torrentUrl: torrent.url,
            uploadDate: torrent.date_uploaded,
          });
        }
      }

      logger.info(`YTS search complete: ${results.length} results`);
      return results;
    } catch (error) {
      logger.error('YTS search failed', error as Error, { query, options });
      return [];
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/list_movies.json?limit=1`, 5000);
      return response.ok;
    } catch {
      return false;
    }
  }

  private buildMagnetLink(hash: string, title: string, year: number): string {
    const trackers = [
      'udp://open.demonii.com:1337/announce',
      'udp://tracker.openbittorrent.com:80',
      'udp://tracker.coppersurfer.tk:6969',
      'udp://glotorrents.pw:6969/announce',
      'udp://tracker.opentrackr.org:1337/announce',
      'udp://torrent.gresille.org:80/announce',
      'udp://p4p.arenabg.com:1337',
      'udp://tracker.leechers-paradise.org:6969',
    ];

    const dn = encodeURIComponent(`${title} (${year})`);
    const trackerParams = trackers.map(t => `&tr=${encodeURIComponent(t)}`).join('');
    
    return `magnet:?xt=urn:btih:${hash}&dn=${dn}${trackerParams}`;
  }
}

/**
 * 1337x Provider (1337x.to)
 * General purpose torrent search
 * 
 * Note: Requires HTML scraping as no official API exists.
 * This is a placeholder implementation - requires cheerio or similar for scraping.
 */
class Provider1337x implements TorrentProvider {
  name = '1337x';
  private baseUrl = 'https://1337x.to';
  private lastRequest = 0;
  private minInterval = 2000; // 2 seconds between requests (be respectful)

  private async fetchWithTimeout(url: string, timeoutMs: number, init?: FetchRequestInit) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...(init ?? {}), signal: controller.signal } as FetchRequestInit);
    } finally {
      clearTimeout(timeout);
    }
  }

  async search(query: string, options: SearchOptions = {}): Promise<TorrentResult[]> {
    logger.warn('1337x provider not fully implemented - requires HTML scraping');
    return [];
    
    // TODO: Implement scraping with cheerio
    // Example flow:
    // 1. Fetch search page: https://1337x.to/search/{query}/1/
    // 2. Parse HTML to extract torrent links
    // 3. Fetch individual torrent pages for magnet links
    // 4. Extract seeders, leechers, size information
    // 5. Build TorrentResult objects
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(this.baseUrl, 5000);
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Torrent Search Manager
 * Aggregates results from multiple providers
 */
export class TorrentSearchManager {
  private providers: Map<string, TorrentProvider> = new Map();
  private cache: Map<string, { results: TorrentResult[]; timestamp: number }> = new Map();
  private cacheTTL = 300000; // 5 minutes

  constructor() {
    this.registerProvider(new YTSProvider());
    // this.registerProvider(new Provider1337x()); // Disabled until scraping implemented
  }

  /**
   * Register a new torrent provider
   */
  registerProvider(provider: TorrentProvider): void {
    this.providers.set(provider.name, provider);
    logger.info(`Registered torrent provider: ${provider.name}`);
  }

  /**
   * Search across all enabled providers
   */
  async search(query: string, options: SearchOptions = {}): Promise<TorrentResult[]> {
    const cacheKey = `${query}-${JSON.stringify(options)}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      logger.info('Returning cached torrent search results', { query });
      return cached.results;
    }

    // Determine which providers to use
    const providerNames = options.providers || Array.from(this.providers.keys());
    const enabledProviders = providerNames
      .map(name => this.providers.get(name))
      .filter((p): p is TorrentProvider => p !== undefined);

    if (enabledProviders.length === 0) {
      logger.warn('No torrent providers available');
      return [];
    }

    logger.info(`Searching torrents across ${enabledProviders.length} providers`, { query, providers: providerNames });

    // Search all providers in parallel
    const searchPromises = enabledProviders.map(async provider => {
      try {
        const available = await provider.isAvailable();
        if (!available) {
          logger.warn(`Provider ${provider.name} is not available`);
          return [];
        }
        return await provider.search(query, options);
      } catch (error) {
        logger.error(`Provider ${provider.name} search failed`, error as Error, { query });
        return [];
      }
    });

    const resultsArrays = await Promise.all(searchPromises);
    const allResults = resultsArrays.flat();

    // Sort by seeders (descending)
    allResults.sort((a, b) => b.seeders - a.seeders);

    // Apply global limit
    const limit = options.limit || 50;
    const limitedResults = allResults.slice(0, limit);

    // Cache results
    this.cache.set(cacheKey, {
      results: limitedResults,
      timestamp: Date.now(),
    });

    logger.info(`Torrent search complete: ${limitedResults.length} results from ${enabledProviders.length} providers`);

    return limitedResults;
  }

  /**
   * Get details for a specific torrent by provider and ID
   */
  async getDetails(provider: string, id: string): Promise<TorrentResult | null> {
    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      logger.warn(`Provider ${provider} not found`);
      return null;
    }

    if (!providerInstance.getDetails) {
      logger.warn(`Provider ${provider} does not support getDetails`);
      return null;
    }

    try {
      return await providerInstance.getDetails(id);
    } catch (error) {
      logger.error(`Failed to get torrent details from ${provider}`, error as Error, { id });
      return null;
    }
  }

  /**
   * Check status of all providers
   */
  async checkProviderStatus(): Promise<Map<string, boolean>> {
    const status = new Map<string, boolean>();
    
    const checks = Array.from(this.providers.entries()).map(async ([name, provider]) => {
      try {
        const available = await provider.isAvailable();
        status.set(name, available);
      } catch {
        status.set(name, false);
      }
    });

    await Promise.all(checks);
    return status;
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Torrent search cache cleared');
  }

  /**
   * Get list of registered providers
   */
  getProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Singleton instance
export const torrentSearch = new TorrentSearchManager();
