import fs from "fs";
import path from "path";
import { getLogger } from "./logger";

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

export interface CacheOptions {
  ttl?: number; // default TTL in milliseconds
  maxSize?: number; // max entries before eviction
  persistPath?: string; // optional file path for persistence
}

export class Cache<T = any> {
  private store: Map<string, CacheEntry<T>> = new Map();
  private options: Required<CacheOptions>;
  private logger = getLogger();
  private persistTimer: NodeJS.Timeout | null = null;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl ?? 3600000, // 1 hour default
      maxSize: options.maxSize ?? 1000,
      persistPath: options.persistPath ?? "",
    };

    // Load from disk if persistence enabled
    if (this.options.persistPath) {
      this.loadFromDisk();
      this.startPersistTimer();
    }
  }

  /**
   * Get value from cache
   * Returns undefined if not found or expired
   */
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    
    if (!entry) {
      return undefined;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.store.delete(key);
      this.logger.debug("Cache entry expired", { key });
      return undefined;
    }

    this.logger.debug("Cache hit", { key });
    return entry.data;
  }

  /**
   * Set value in cache with optional custom TTL
   */
  set(key: string, data: T, ttl?: number): void {
    // Evict oldest entry if at max size
    if (this.store.size >= this.options.maxSize) {
      const oldestKey = this.getOldestKey();
      if (oldestKey) {
        this.store.delete(oldestKey);
        this.logger.debug("Cache evicted oldest entry", { key: oldestKey });
      }
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.options.ttl,
    };

    this.store.set(key, entry);
    this.logger.debug("Cache set", { key, ttl: entry.ttl });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete specific key
   */
  delete(key: string): boolean {
    const deleted = this.store.delete(key);
    if (deleted) {
      this.logger.debug("Cache entry deleted", { key });
    }
    return deleted;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.store.clear();
    this.logger.info("Cache cleared");
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    
    for (const [, entry] of this.store) {
      if (now - entry.timestamp > entry.ttl) {
        expired++;
      }
    }

    return {
      size: this.store.size,
      maxSize: this.options.maxSize,
      expired,
      active: this.store.size - expired,
    };
  }

  /**
   * Remove expired entries (garbage collection)
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.store) {
      if (now - entry.timestamp > entry.ttl) {
        this.store.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      this.logger.info("Cache cleanup completed", { removed });
    }

    return removed;
  }

  /**
   * Get oldest entry key (for eviction)
   */
  private getOldestKey(): string | undefined {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;

    for (const [key, entry] of this.store) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * Save cache to disk
   */
  private saveToDisk(): void {
    if (!this.options.persistPath) return;

    try {
      const dir = path.dirname(this.options.persistPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Convert Map to array for JSON serialization
      const entries = Array.from(this.store.entries());
      const data = JSON.stringify({ entries, version: 1 }, null, 2);
      
      fs.writeFileSync(this.options.persistPath, data, "utf8");
      this.logger.debug("Cache persisted to disk", { 
        path: this.options.persistPath,
        entries: entries.length 
      });
    } catch (error) {
      this.logger.error("Failed to persist cache", error as Error);
    }
  }

  /**
   * Load cache from disk
   */
  private loadFromDisk(): void {
    if (!this.options.persistPath) return;

    try {
      if (!fs.existsSync(this.options.persistPath)) {
        return;
      }

      const data = fs.readFileSync(this.options.persistPath, "utf8");
      const parsed = JSON.parse(data);

      if (parsed.version === 1 && Array.isArray(parsed.entries)) {
        this.store = new Map(parsed.entries);
        
        // Clean up expired entries on load
        this.cleanup();
        
        this.logger.info("Cache loaded from disk", { 
          path: this.options.persistPath,
          entries: this.store.size 
        });
      }
    } catch (error) {
      this.logger.error("Failed to load cache from disk", error as Error);
      this.store.clear();
    }
  }

  /**
   * Start periodic persistence
   */
  private startPersistTimer(): void {
    if (this.persistTimer) {
      clearInterval(this.persistTimer);
    }

    // Persist every 5 minutes
    this.persistTimer = setInterval(() => {
      this.saveToDisk();
      this.cleanup(); // Also cleanup expired entries
    }, 300000);
  }

  /**
   * Shutdown cache and persist
   */
  async shutdown(): Promise<void> {
    if (this.persistTimer) {
      clearInterval(this.persistTimer);
      this.persistTimer = null;
    }

    if (this.options.persistPath) {
      this.saveToDisk();
    }

    this.logger.info("Cache shutdown complete");
  }
}

/**
 * Create a cache key from components
 */
export function createCacheKey(...parts: (string | number)[]): string {
  return parts.join(":");
}
