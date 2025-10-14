import { describe, it, expect } from "vitest";
import { MockDownloader } from "../src/downloader";

describe("MockDownloader", () => {
  it("should start and complete a job", async () => {
    const d = new MockDownloader();
    const job = { id: "job-1", sourceType: "http", sourceUrn: "http://example", status: "queued" } as any;
    let completed = false;
    d.on("completed", (j: any) => {
      completed = true;
      expect(j.status).toBe("completed");
    });
    await d.start(job);
    // wait for a short time for the simulated completion
    await new Promise((r) => setTimeout(r, 700));
    expect(completed).toBe(true);
  });
});
