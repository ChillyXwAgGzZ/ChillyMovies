import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

describe("SQLite FTS Benchmark", () => {
  const dbPath = path.join(process.cwd(), "test-data", "benchmark.db");
  let db: Database.Database;

  beforeEach(() => {
    // Ensure test-data directory exists
    if (!fs.existsSync(path.dirname(dbPath))) {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    }
    // Remove existing db
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    db = new Database(dbPath);
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });

  it("should benchmark FTS5 indexing for 1,000 items", async () => {
    // Create FTS5 table
    db.exec(`
      CREATE VIRTUAL TABLE media_fts USING fts5(
        title,
        original_title,
        overview,
        tokenize = 'porter unicode61'
      );
    `);

    const insertStmt = db.prepare(`
      INSERT INTO media_fts (title, original_title, overview)
      VALUES (?, ?, ?)
    `);

    // Generate synthetic data
    const startIndexing = performance.now();
    const insertMany = db.transaction((items: any[]) => {
      for (const item of items) {
        insertStmt.run(item.title, item.originalTitle, item.overview);
      }
    });

    const items = generateSyntheticData(1000);
    insertMany(items);
    const indexingTime = performance.now() - startIndexing;

    console.log(`\n[FTS5 Benchmark - 1,000 items]`);
    console.log(`Indexing time: ${indexingTime.toFixed(2)}ms`);
    console.log(`Throughput: ${(1000 / (indexingTime / 1000)).toFixed(2)} items/sec`);

    // Verify data was inserted
    const count = db.prepare("SELECT COUNT(*) as count FROM media_fts").get() as { count: number };
    expect(count.count).toBe(1000);
    expect(indexingTime).toBeLessThan(5000); // Should complete in under 5 seconds
  });

  it("should benchmark FTS5 query performance", () => {
    // Setup table with data
    db.exec(`
      CREATE VIRTUAL TABLE media_fts USING fts5(
        title,
        original_title,
        overview,
        tokenize = 'porter unicode61'
      );
    `);

    const insertStmt = db.prepare(`
      INSERT INTO media_fts (title, original_title, overview)
      VALUES (?, ?, ?)
    `);

    const items = generateSyntheticData(5000);
    const insertMany = db.transaction((data: any[]) => {
      for (const item of data) {
        insertStmt.run(item.title, item.originalTitle, item.overview);
      }
    });
    insertMany(items);

    // Benchmark queries
    const queries = [
      "action",
      "love story",
      "space adventure",
      "thriller suspense",
      "comedy drama"
    ];

    const queryStmt = db.prepare(`
      SELECT * FROM media_fts 
      WHERE media_fts MATCH ? 
      LIMIT 20
    `);

    console.log(`\n[FTS5 Query Benchmark - 5,000 items]`);
    
    const latencies: number[] = [];
    for (const query of queries) {
      const start = performance.now();
      const results = queryStmt.all(query);
      const latency = performance.now() - start;
      latencies.push(latency);
      console.log(`Query "${query}": ${latency.toFixed(2)}ms (${results.length} results)`);
    }

    // Calculate statistics
    latencies.sort((a, b) => a - b);
    const median = latencies[Math.floor(latencies.length / 2)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;

    console.log(`\nQuery Statistics:`);
    console.log(`  Median: ${median.toFixed(2)}ms`);
    console.log(`  95th percentile: ${p95.toFixed(2)}ms`);
    console.log(`  Average: ${avg.toFixed(2)}ms`);

    // Performance assertions
    expect(median).toBeLessThan(50); // Median under 50ms
    expect(p95).toBeLessThan(100); // 95th percentile under 100ms
  });

  it("should benchmark FTS5 with 10,000 items (medium library)", () => {
    db.exec(`
      CREATE VIRTUAL TABLE media_fts USING fts5(
        title,
        original_title,
        overview,
        tokenize = 'porter unicode61'
      );
    `);

    const insertStmt = db.prepare(`
      INSERT INTO media_fts (title, original_title, overview)
      VALUES (?, ?, ?)
    `);

    const startIndexing = performance.now();
    const items = generateSyntheticData(10000);
    const insertMany = db.transaction((data: any[]) => {
      for (const item of data) {
        insertStmt.run(item.title, item.originalTitle, item.overview);
      }
    });
    insertMany(items);
    const indexingTime = performance.now() - startIndexing;

    console.log(`\n[FTS5 Benchmark - 10,000 items]`);
    console.log(`Indexing time: ${indexingTime.toFixed(2)}ms`);
    console.log(`Throughput: ${(10000 / (indexingTime / 1000)).toFixed(2)} items/sec`);

    // Query performance test
    const queryStmt = db.prepare(`
      SELECT * FROM media_fts 
      WHERE media_fts MATCH ? 
      LIMIT 20
    `);

    const start = performance.now();
    const results = queryStmt.all("action thriller");
    const queryTime = performance.now() - start;

    console.log(`Sample query time: ${queryTime.toFixed(2)}ms (${results.length} results)`);

    expect(indexingTime).toBeLessThan(15000); // Should complete in under 15 seconds
    expect(queryTime).toBeLessThan(100); // Query under 100ms
  });

  it("should compare FTS5 vs LIKE performance", () => {
    // Create regular table
    db.exec(`
      CREATE TABLE media_regular (
        id INTEGER PRIMARY KEY,
        title TEXT,
        original_title TEXT,
        overview TEXT
      );
      CREATE INDEX idx_title ON media_regular(title);
    `);

    // Create FTS5 table
    db.exec(`
      CREATE VIRTUAL TABLE media_fts USING fts5(
        title,
        original_title,
        overview
      );
    `);

    const items = generateSyntheticData(5000);

    // Insert into regular table
    const insertRegular = db.prepare(`
      INSERT INTO media_regular (title, original_title, overview)
      VALUES (?, ?, ?)
    `);
    const insertManyRegular = db.transaction((data: any[]) => {
      for (const item of data) {
        insertRegular.run(item.title, item.originalTitle, item.overview);
      }
    });
    insertManyRegular(items);

    // Insert into FTS5 table
    const insertFts = db.prepare(`
      INSERT INTO media_fts (title, original_title, overview)
      VALUES (?, ?, ?)
    `);
    const insertManyFts = db.transaction((data: any[]) => {
      for (const item of data) {
        insertFts.run(item.title, item.originalTitle, item.overview);
      }
    });
    insertManyFts(items);

    console.log(`\n[LIKE vs FTS5 Comparison - 5,000 items]`);

    // Benchmark LIKE query
    const likeQuery = db.prepare(`
      SELECT * FROM media_regular 
      WHERE title LIKE ? OR overview LIKE ?
      LIMIT 20
    `);
    const startLike = performance.now();
    const likeResults = likeQuery.all("%action%", "%action%");
    const likeTime = performance.now() - startLike;

    // Benchmark FTS5 query
    const ftsQuery = db.prepare(`
      SELECT * FROM media_fts 
      WHERE media_fts MATCH 'action'
      LIMIT 20
    `);
    const startFts = performance.now();
    const ftsResults = ftsQuery.all();
    const ftsTime = performance.now() - startFts;

    console.log(`LIKE query: ${likeTime.toFixed(2)}ms (${likeResults.length} results)`);
    console.log(`FTS5 query: ${ftsTime.toFixed(2)}ms (${ftsResults.length} results)`);
    console.log(`FTS5 speedup: ${(likeTime / ftsTime).toFixed(2)}x faster`);

    // Both should return same results
    expect(likeResults.length).toBe(ftsResults.length);
    
    // Performance comparison: FTS5 is typically faster, but for small datasets
    // the difference may be negligible. We just verify both execute quickly.
    expect(ftsTime).toBeLessThan(5); // Should complete in under 5ms
    expect(likeTime).toBeLessThan(5); // Should complete in under 5ms
  });
});

// Helper function to generate synthetic movie data
function generateSyntheticData(count: number) {
  const genres = ["Action", "Comedy", "Drama", "Thriller", "Romance", "Sci-Fi", "Horror", "Adventure"];
  const adjectives = ["Epic", "Dark", "Romantic", "Intense", "Hilarious", "Gripping", "Mysterious", "Explosive"];
  const nouns = ["Journey", "Story", "Adventure", "Mission", "Quest", "Battle", "Legacy", "Destiny"];
  
  const items = [];
  for (let i = 0; i < count; i++) {
    const genre = genres[i % genres.length];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    items.push({
      title: `${adj} ${genre} ${noun} ${i}`,
      originalTitle: `${adj} ${genre} ${noun} ${i}`,
      overview: `An ${adj.toLowerCase()} ${genre.toLowerCase()} ${noun.toLowerCase()} that takes viewers on an unforgettable journey. This film explores themes of love, loss, and redemption in a unique and compelling way. Perfect for fans of ${genre.toLowerCase()} films.`
    });
  }
  return items;
}
