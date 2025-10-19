/**
 * Simple 1337x scraper for torrent search
 * Uses HTML parsing to extract torrent information
 */

import { getLogger } from './logger';
import fetch, { RequestInit as FetchRequestInit } from 'node-fetch';
import { TorrentResult, SearchOptions, TorrentProvider } from './torrent-search';

const logger = getLogger();

export class Provider1337xScraper implements TorrentProvider {
  name = '1337x';
  private baseUrl = 'https://1337x.to';
  private lastRequest = 0;
  private minInterval = 3000; // 3 seconds between requests

  private async fetchWithTimeout(url: string, timeoutMs: number, init?: FetchRequestInit) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { 
        ...(init ?? {}), 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'DNT': '1',
          'Connection': 'keep-alive',
          ...((init?.headers as Record<string, string>) || {})
        }
      } as FetchRequestInit);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    if (timeSinceLastRequest < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastRequest));
    }
    this.lastRequest = Date.now();
  }

  async search(query: string, options: SearchOptions = {}): Promise<TorrentResult[]> {
    try {
      await this.rateLimit();

      // Construct search URL
      const searchQuery = encodeURIComponent(query);
      const url = `${this.baseUrl}/search/${searchQuery}/1/`;
      
      logger.info(`1337x search: ${query}`, { url });

      const response = await this.fetchWithTimeout(url, 15000);
      
      if (!response.ok) {
        throw new Error(`1337x returned ${response.status}`);
      }

      const html = await response.text();
      const results = this.parseSearchResults(html, options);
      
      logger.info(`1337x search complete: ${results.length} results`);
      return results;

    } catch (error) {
      logger.error('1337x search failed', error as Error, { query, options });
      return [];
    }
  }

  private parseSearchResults(html: string, options: SearchOptions): TorrentResult[] {
    const results: TorrentResult[] = [];
    
    try {
      // Basic regex-based parsing (more robust than full DOM parsing)
      // Look for table rows with torrent data
      const rowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
      const rows = html.match(rowRegex) || [];

      for (const row of rows) {
        // Skip header rows and non-torrent rows
        if (!row.includes('/torrent/') || row.includes('<th')) continue;

        try {
          const result = this.parseTableRow(row, options);
          if (result) {
            results.push(result);
          }
        } catch (error) {
          // Skip this row and continue
          continue;
        }
      }

      return results
        .filter(r => !options.minSeeders || r.seeders >= options.minSeeders)
        .slice(0, options.limit || 20);

    } catch (error) {
      logger.error('Failed to parse 1337x results', error as Error);
      return [];
    }
  }

  private parseTableRow(row: string, options: SearchOptions): TorrentResult | null {
    try {
      // Extract torrent ID and title
      const idMatch = row.match(/\/torrent\/(\d+)\//);
      const titleMatch = row.match(/<a[^>]*href="\/torrent\/\d+\/[^"]*"[^>]*>([^<]+)<\/a>/i);
      
      if (!idMatch || !titleMatch) return null;

      const id = idMatch[1];
      const title = titleMatch[1].trim();

      // Extract seeders (green text)
      const seedersMatch = row.match(/<td[^>]*class="[^"]*green[^"]*"[^>]*>(\d+)<\/td>/i);
      const seeders = seedersMatch ? parseInt(seedersMatch[1]) : 0;

      // Extract leechers (red text) 
      const leechersMatch = row.match(/<td[^>]*class="[^"]*red[^"]*"[^>]*>(\d+)<\/td>/i);
      const leechers = leechersMatch ? parseInt(leechersMatch[1]) : 0;

      // Extract size
      const sizeMatch = row.match(/<td[^>]*>([^<]*(?:GB|MB|KB))<\/td>/i);
      const sizeFormatted = sizeMatch ? sizeMatch[1].trim() : 'Unknown';
      
      // Convert size to bytes (rough estimate)
      const size = this.parseSizeToBytes(sizeFormatted);

      // Detect quality from title
      const quality = this.extractQuality(title);

      // Apply quality filter
      if (options.quality?.length && quality && !options.quality.includes(quality)) {
        return null;
      }

      // Determine media type
      const type = this.detectMediaType(title);
      if (options.type && type !== options.type) {
        return null;
      }

      return {
        id: `1337x-${id}`,
        title,
        quality,
        size,
        sizeFormatted,
        seeders,
        leechers,
        magnetLink: '', // We'll need to fetch this from the torrent page
        provider: this.name,
        type,
      };

    } catch (error) {
      return null;
    }
  }

  private extractQuality(title: string): string | undefined {
    const qualityMatch = title.match(/\b(2160p|1080p|720p|480p|360p)\b/i);
    return qualityMatch ? qualityMatch[1].toLowerCase() : undefined;
  }

  private detectMediaType(title: string): 'movie' | 'tv' {
    // Basic heuristics
    if (/\b(S\d+E\d+|Season|Episode)\b/i.test(title)) {
      return 'tv';
    }
    return 'movie';
  }

  private parseSizeToBytes(sizeStr: string): number {
    const match = sizeStr.match(/([0-9.]+)\s*(GB|MB|KB)/i);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    switch (unit) {
      case 'GB': return Math.round(value * 1024 * 1024 * 1024);
      case 'MB': return Math.round(value * 1024 * 1024);
      case 'KB': return Math.round(value * 1024);
      default: return 0;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(this.baseUrl, 5000);
      return response.ok && response.url.includes('1337x');
    } catch {
      return false;
    }
  }

  async getDetails(id: string): Promise<TorrentResult | null> {
    try {
      await this.rateLimit();
      
      const torrentId = id.replace('1337x-', '');
      const response = await this.fetchWithTimeout(`${this.baseUrl}/torrent/${torrentId}/`, 10000);
      
      if (!response.ok) return null;
      
      const html = await response.text();
      
      // Extract magnet link
      const magnetMatch = html.match(/href="(magnet:[^"]+)"/i);
      if (!magnetMatch) return null;

      // This is a simplified version - in practice we'd parse more details
      return {
        id,
        title: '',
        size: 0,
        sizeFormatted: '',
        seeders: 0,
        leechers: 0,
        magnetLink: magnetMatch[1],
        provider: this.name,
        type: 'movie',
      };

    } catch (error) {
      logger.error('Failed to get 1337x torrent details', error as Error, { id });
      return null;
    }
  }
}