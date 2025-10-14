import { describe, it, expect } from "vitest";
import { MockMetadataFetcher } from "../src/metadata";

describe("MockMetadataFetcher", () => {
  it("fetchByTMDBId returns mock data", async () => {
    const m = new MockMetadataFetcher();
    const res = await m.fetchByTMDBId(42);
    expect(res).not.toBeNull();
    expect(res!.title).toContain("Mock Movie");
  });
});
