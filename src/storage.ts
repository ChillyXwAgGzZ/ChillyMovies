import path from "path";
import fs from "fs";
let Database: any = null;
try {
  // optional dependency, may fail to build in some CI/dev containers
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Database = require("better-sqlite3");
} catch (e) {
  Database = null;
}

export interface StorageManagerOptions {
  dbPath?: string;
  mediaRoot?: string;
}

export class StorageManager {
  private db: any;
  private mediaRoot: string;

  constructor(opts: StorageManagerOptions = {}) {
    const dbPath = opts.dbPath ?? path.resolve(process.cwd(), "chilly.db");
    if (Database) {
      this.db = new Database(dbPath);
    } else {
      // fallback to a simple JSON file store for environments where native modules fail to build
      const jsonPath = dbPath + ".json";
      this.db = { jsonPath };
      if (!fs.existsSync(jsonPath)) fs.writeFileSync(jsonPath, JSON.stringify({ media_items: {} }));
    }
    this.mediaRoot = opts.mediaRoot ?? path.resolve(process.cwd(), "media");
    if (!fs.existsSync(this.mediaRoot)) fs.mkdirSync(this.mediaRoot, { recursive: true });
    this.migrate();
  }

  private migrate() {
    if (Database) {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS media_items (
          id TEXT PRIMARY KEY,
          title TEXT,
          metadata_json TEXT,
          created_at TEXT
        );
        
        CREATE TABLE IF NOT EXISTS tv_episodes (
          id TEXT PRIMARY KEY,
          tmdb_id INTEGER,
          season_number INTEGER,
          episode_number INTEGER,
          title TEXT,
          download_id TEXT,
          status TEXT,
          metadata_json TEXT,
          created_at TEXT,
          UNIQUE(tmdb_id, season_number, episode_number)
        );
        
        CREATE TABLE IF NOT EXISTS batch_downloads (
          batch_id TEXT PRIMARY KEY,
          tmdb_id INTEGER,
          season_number INTEGER,
          total_episodes INTEGER,
          completed_episodes INTEGER,
          failed_episodes INTEGER,
          status TEXT,
          created_at TEXT,
          updated_at TEXT
        );
      `);
    } else {
      // json store already created with additional structures
      const obj = JSON.parse(fs.readFileSync(this.db.jsonPath, "utf8"));
      if (!obj.tv_episodes) obj.tv_episodes = {};
      if (!obj.batch_downloads) obj.batch_downloads = {};
      fs.writeFileSync(this.db.jsonPath, JSON.stringify(obj));
    }
  }

  addMediaItem(id: string, title: string, metadata: object) {
    if (Database) {
      const stmt = this.db.prepare("INSERT OR REPLACE INTO media_items (id, title, metadata_json, created_at) VALUES (?, ?, ?, datetime('now'))");
      stmt.run(id, title, JSON.stringify(metadata));
    } else {
      const obj = JSON.parse(fs.readFileSync(this.db.jsonPath, "utf8"));
      obj.media_items[id] = { id, title, metadata, created_at: new Date().toISOString() };
      fs.writeFileSync(this.db.jsonPath, JSON.stringify(obj));
    }
  }

  getMediaItem(id: string) {
    if (Database) {
      const row = this.db.prepare("SELECT * FROM media_items WHERE id = ?").get(id);
      if (!row) return null;
      return { id: row.id, title: row.title, metadata: JSON.parse(row.metadata_json), createdAt: row.created_at };
    }
    const obj = JSON.parse(fs.readFileSync(this.db.jsonPath, "utf8"));
    const r = obj.media_items[id];
    if (!r) return null;
    return r;
  }

  getMediaRoot() {
    return this.mediaRoot;
  }

  getAllItems() {
    if (Database) {
      const rows = this.db.prepare("SELECT * FROM media_items ORDER BY created_at DESC").all();
      return rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        metadata: JSON.parse(row.metadata_json),
        createdAt: row.created_at,
      }));
    }
    const obj = JSON.parse(fs.readFileSync(this.db.jsonPath, "utf8"));
    return Object.values(obj.media_items);
  }

  getItem(id: string) {
    return this.getMediaItem(id);
  }

  // Partial file helpers used by downloaders to resume/cleanup
  getPartialPath(id: string) {
    return path.join(this.mediaRoot, `${id}.partial`);
  }

  getPartialSize(id: string) {
    const p = this.getPartialPath(id);
    try {
      const st = fs.statSync(p);
      return st.size;
    } catch (e) {
      return 0;
    }
  }

  removePartial(id: string) {
    const p = this.getPartialPath(id);
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (e) {
      // ignore
    }
  }

  // TV Episode tracking
  addTVEpisode(tmdbId: number, seasonNumber: number, episodeNumber: number, title: string, downloadId: string, metadata: object = {}) {
    const id = `tv-${tmdbId}-s${seasonNumber}e${episodeNumber}`;
    
    if (Database) {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO tv_episodes 
        (id, tmdb_id, season_number, episode_number, title, download_id, status, metadata_json, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, 'downloading', ?, datetime('now'))
      `);
      stmt.run(id, tmdbId, seasonNumber, episodeNumber, title, downloadId, JSON.stringify(metadata));
    } else {
      const obj = JSON.parse(fs.readFileSync(this.db.jsonPath, "utf8"));
      obj.tv_episodes[id] = {
        id,
        tmdb_id: tmdbId,
        season_number: seasonNumber,
        episode_number: episodeNumber,
        title,
        download_id: downloadId,
        status: 'downloading',
        metadata,
        created_at: new Date().toISOString(),
      };
      fs.writeFileSync(this.db.jsonPath, JSON.stringify(obj));
    }
  }

  updateEpisodeStatus(tmdbId: number, seasonNumber: number, episodeNumber: number, status: string) {
    const id = `tv-${tmdbId}-s${seasonNumber}e${episodeNumber}`;
    
    if (Database) {
      const stmt = this.db.prepare("UPDATE tv_episodes SET status = ? WHERE id = ?");
      stmt.run(status, id);
    } else {
      const obj = JSON.parse(fs.readFileSync(this.db.jsonPath, "utf8"));
      if (obj.tv_episodes[id]) {
        obj.tv_episodes[id].status = status;
        fs.writeFileSync(this.db.jsonPath, JSON.stringify(obj));
      }
    }
  }

  getTVEpisodes(tmdbId: number, seasonNumber?: number) {
    if (Database) {
      let query = "SELECT * FROM tv_episodes WHERE tmdb_id = ?";
      const params: any[] = [tmdbId];
      
      if (seasonNumber !== undefined) {
        query += " AND season_number = ?";
        params.push(seasonNumber);
      }
      
      query += " ORDER BY season_number, episode_number";
      
      const rows = this.db.prepare(query).all(...params);
      return rows.map((row: any) => ({
        id: row.id,
        tmdbId: row.tmdb_id,
        seasonNumber: row.season_number,
        episodeNumber: row.episode_number,
        title: row.title,
        downloadId: row.download_id,
        status: row.status,
        metadata: JSON.parse(row.metadata_json || '{}'),
        createdAt: row.created_at,
      }));
    } else {
      const obj = JSON.parse(fs.readFileSync(this.db.jsonPath, "utf8"));
      return Object.values(obj.tv_episodes || {})
        .filter((ep: any) => {
          if (ep.tmdb_id !== tmdbId) return false;
          if (seasonNumber !== undefined && ep.season_number !== seasonNumber) return false;
          return true;
        })
        .sort((a: any, b: any) => {
          if (a.season_number !== b.season_number) return a.season_number - b.season_number;
          return a.episode_number - b.episode_number;
        });
    }
  }

  // Batch download tracking
  createBatchDownload(batchId: string, tmdbId: number, seasonNumber: number, totalEpisodes: number) {
    if (Database) {
      const stmt = this.db.prepare(`
        INSERT INTO batch_downloads 
        (batch_id, tmdb_id, season_number, total_episodes, completed_episodes, failed_episodes, status, created_at, updated_at) 
        VALUES (?, ?, ?, ?, 0, 0, 'active', datetime('now'), datetime('now'))
      `);
      stmt.run(batchId, tmdbId, seasonNumber, totalEpisodes);
    } else {
      const obj = JSON.parse(fs.readFileSync(this.db.jsonPath, "utf8"));
      obj.batch_downloads[batchId] = {
        batch_id: batchId,
        tmdb_id: tmdbId,
        season_number: seasonNumber,
        total_episodes: totalEpisodes,
        completed_episodes: 0,
        failed_episodes: 0,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      fs.writeFileSync(this.db.jsonPath, JSON.stringify(obj));
    }
  }

  updateBatchDownload(batchId: string, updates: { completed?: number; failed?: number; status?: string }) {
    if (Database) {
      const parts: string[] = [];
      const params: any[] = [];
      
      if (updates.completed !== undefined) {
        parts.push("completed_episodes = ?");
        params.push(updates.completed);
      }
      if (updates.failed !== undefined) {
        parts.push("failed_episodes = ?");
        params.push(updates.failed);
      }
      if (updates.status) {
        parts.push("status = ?");
        params.push(updates.status);
      }
      
      parts.push("updated_at = datetime('now')");
      params.push(batchId);
      
      const stmt = this.db.prepare(`UPDATE batch_downloads SET ${parts.join(', ')} WHERE batch_id = ?`);
      stmt.run(...params);
    } else {
      const obj = JSON.parse(fs.readFileSync(this.db.jsonPath, "utf8"));
      if (obj.batch_downloads[batchId]) {
        if (updates.completed !== undefined) obj.batch_downloads[batchId].completed_episodes = updates.completed;
        if (updates.failed !== undefined) obj.batch_downloads[batchId].failed_episodes = updates.failed;
        if (updates.status) obj.batch_downloads[batchId].status = updates.status;
        obj.batch_downloads[batchId].updated_at = new Date().toISOString();
        fs.writeFileSync(this.db.jsonPath, JSON.stringify(obj));
      }
    }
  }

  getBatchDownload(batchId: string) {
    if (Database) {
      const row = this.db.prepare("SELECT * FROM batch_downloads WHERE batch_id = ?").get(batchId);
      if (!row) return null;
      return {
        batchId: row.batch_id,
        tmdbId: row.tmdb_id,
        seasonNumber: row.season_number,
        totalEpisodes: row.total_episodes,
        completedEpisodes: row.completed_episodes,
        failedEpisodes: row.failed_episodes,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } else {
      const obj = JSON.parse(fs.readFileSync(this.db.jsonPath, "utf8"));
      return obj.batch_downloads[batchId] || null;
    }
  }

  getAllBatchDownloads() {
    if (Database) {
      const rows = this.db.prepare("SELECT * FROM batch_downloads ORDER BY created_at DESC").all();
      return rows.map((row: any) => ({
        batchId: row.batch_id,
        tmdbId: row.tmdb_id,
        seasonNumber: row.season_number,
        totalEpisodes: row.total_episodes,
        completedEpisodes: row.completed_episodes,
        failedEpisodes: row.failed_episodes,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } else {
      const obj = JSON.parse(fs.readFileSync(this.db.jsonPath, "utf8"));
      return Object.values(obj.batch_downloads || {});
    }
  }
}
