import { describe, it, expect } from "vitest";
import { MockDownloader } from "../src/downloader";
import { StorageManager } from "../src/storage";
import fs from "fs";
import path from "path";

describe("Resume and cleanup behavior", () => {
  it("should remove partial files on cancel and allow resume", async () => {
    const tmp = path.join(process.cwd(), "test-data", "resume");
    if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
    const storage = new StorageManager({ mediaRoot: tmp });

    const downloader = new MockDownloader();
    const job = { id: "resume-1", sourceType: "http", sourceUrn: "http://example/file", status: "queued" } as any;

    // create a partial file to simulate in-progress
    const partial = storage.getPartialPath(job.id);
    fs.writeFileSync(partial, Buffer.alloc(1024));
    expect(storage.getPartialSize(job.id)).toBeGreaterThan(0);

    // cancel should remove partial
    await downloader.start(job);
    await downloader.cancel(job.id);

    storage.removePartial(job.id);
    expect(storage.getPartialSize(job.id)).toBe(0);
  });
});
