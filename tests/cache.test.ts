import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Cache, createCacheKey } from "../src/cache";
import fs from "fs";
import path from "path";

describe("Cache", () => {
  const testCachePath = path.join(process.cwd(), "test-data", "test-cache.json");
  let cache: Cache;

  beforeEach(() => {
    // Clean up any existing cache file
    if (fs.existsSync(testCachePath)) {
      fs.unlinkSync(testCachePath);
    }
  });

  afterEach(async () => {
    if (cache) {
      await cache.shutdown();
    }
    // Clean up
    if (fs.existsSync(testCachePath)) {
      fs.unlinkSync(testCachePath);
    }
  });

  it("should set and get values", () => {
    cache = new Cache({ ttl: 10000 });
    
    cache.set("key1", { data: "value1" });
    const value = cache.get("key1");
    
    expect(value).toEqual({ data: "value1" });
  });

  it("should return undefined for missing keys", () => {
    cache = new Cache();
    
    const value = cache.get("nonexistent");
    expect(value).toBeUndefined();
  });

  it("should expire entries after TTL", async () => {
    cache = new Cache({ ttl: 100 }); // 100ms TTL
    
    cache.set("key1", "value1");
    expect(cache.get("key1")).toBe("value1");
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(cache.get("key1")).toBeUndefined();
  });

  it("should support custom TTL per entry", async () => {
    cache = new Cache({ ttl: 1000 }); // Default 1 second
    
    cache.set("key1", "value1", 100); // Custom 100ms
    cache.set("key2", "value2"); // Uses default
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(cache.get("key1")).toBeUndefined(); // Expired
    expect(cache.get("key2")).toBe("value2"); // Still valid
  });

  it("should check if key exists", () => {
    cache = new Cache();
    
    cache.set("key1", "value1");
    
    expect(cache.has("key1")).toBe(true);
    expect(cache.has("key2")).toBe(false);
  });

  it("should delete specific keys", () => {
    cache = new Cache();
    
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    
    expect(cache.delete("key1")).toBe(true);
    expect(cache.get("key1")).toBeUndefined();
    expect(cache.get("key2")).toBe("value2");
  });

  it("should clear all entries", () => {
    cache = new Cache();
    
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.set("key3", "value3");
    
    cache.clear();
    
    expect(cache.get("key1")).toBeUndefined();
    expect(cache.get("key2")).toBeUndefined();
    expect(cache.get("key3")).toBeUndefined();
  });

  it("should evict oldest entry when max size is reached", () => {
    cache = new Cache({ maxSize: 3 });
    
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.set("key3", "value3");
    
    // This should evict key1 (oldest)
    cache.set("key4", "value4");
    
    expect(cache.get("key1")).toBeUndefined();
    expect(cache.get("key2")).toBe("value2");
    expect(cache.get("key3")).toBe("value3");
    expect(cache.get("key4")).toBe("value4");
  });

  it("should provide cache statistics", async () => {
    cache = new Cache({ ttl: 100, maxSize: 10 });
    
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.set("key3", "value3");
    
    let stats = cache.getStats();
    expect(stats.size).toBe(3);
    expect(stats.maxSize).toBe(10);
    expect(stats.active).toBe(3);
    expect(stats.expired).toBe(0);
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 150));
    
    stats = cache.getStats();
    expect(stats.expired).toBe(3);
    expect(stats.active).toBe(0);
  });

  it("should cleanup expired entries", async () => {
    cache = new Cache({ ttl: 100 });
    
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.set("key3", "value3", 500); // Longer TTL
    
    // Wait for first two to expire
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const removed = cache.cleanup();
    
    expect(removed).toBe(2);
    expect(cache.get("key1")).toBeUndefined();
    expect(cache.get("key2")).toBeUndefined();
    expect(cache.get("key3")).toBe("value3");
  });

  it("should persist to disk when configured", async () => {
    cache = new Cache({ persistPath: testCachePath, ttl: 10000 });
    
    cache.set("key1", { data: "value1" });
    cache.set("key2", { data: "value2" });
    
    await cache.shutdown();
    
    // Verify file exists
    expect(fs.existsSync(testCachePath)).toBe(true);
    
    // Load cache from disk
    const cache2 = new Cache({ persistPath: testCachePath, ttl: 10000 });
    
    expect(cache2.get("key1")).toEqual({ data: "value1" });
    expect(cache2.get("key2")).toEqual({ data: "value2" });
    
    await cache2.shutdown();
  });

  it("should handle missing persist file gracefully", () => {
    // Try to load from non-existent file
    cache = new Cache({ persistPath: testCachePath });
    
    // Should not throw and cache should be empty
    expect(cache.get("anything")).toBeUndefined();
  });

  it("should handle corrupted persist file", () => {
    // Create corrupted cache file
    fs.mkdirSync(path.dirname(testCachePath), { recursive: true });
    fs.writeFileSync(testCachePath, "invalid json", "utf8");
    
    // Should not throw and cache should be empty
    cache = new Cache({ persistPath: testCachePath });
    
    expect(cache.get("anything")).toBeUndefined();
  });

  it("should support different data types", () => {
    cache = new Cache();
    
    cache.set("string", "value");
    cache.set("number", 42);
    cache.set("boolean", true);
    cache.set("object", { foo: "bar" });
    cache.set("array", [1, 2, 3]);
    cache.set("null", null);
    
    expect(cache.get("string")).toBe("value");
    expect(cache.get("number")).toBe(42);
    expect(cache.get("boolean")).toBe(true);
    expect(cache.get("object")).toEqual({ foo: "bar" });
    expect(cache.get("array")).toEqual([1, 2, 3]);
    expect(cache.get("null")).toBe(null);
  });
});

describe("createCacheKey", () => {
  it("should create cache keys from components", () => {
    expect(createCacheKey("tmdb", "movie", 123)).toBe("tmdb:movie:123");
    expect(createCacheKey("search", "action")).toBe("search:action");
    expect(createCacheKey("user", 1, "profile")).toBe("user:1:profile");
  });

  it("should handle mixed types", () => {
    expect(createCacheKey("prefix", 42, "suffix")).toBe("prefix:42:suffix");
  });
});
