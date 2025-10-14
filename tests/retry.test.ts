import { describe, it, expect } from "vitest";
import { withRetry } from "../src/retry";

describe("withRetry", () => {
  it("retries failing function and eventually succeeds", async () => {
    let attempts = 0;
    const res = await withRetry(async () => {
      attempts++;
      if (attempts < 3) throw new Error("fail");
      return "ok";
    }, { retries: 4 });
    expect(res).toBe("ok");
    expect(attempts).toBeGreaterThanOrEqual(3);
  });
});
