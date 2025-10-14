import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { StorageManager } from "../src/storage";

describe("StorageManager", () => {
  it("should create DB and add/get item", () => {
    const tmp = path.join(process.cwd(), "test-data");
    if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
    const dbPath = path.join(tmp, "test.db");
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    const s = new StorageManager({ dbPath, mediaRoot: path.join(tmp, "media") });
    s.addMediaItem("id-1", "Test Movie", { foo: "bar" });
    const got = s.getMediaItem("id-1");
    expect(got).not.toBeNull();
    expect(got.title).toBe("Test Movie");
  });
});
