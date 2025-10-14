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
      `);
    } else {
      // json store already created
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
}
