import { describe, it, expect } from "vitest";
import { withRetry } from "../src/retry";

describe("Retry and error recovery", () => {
  it("should retry on transient errors and eventually succeed", async () => {
    let attempts = 0;
    const result = await withRetry(async () => {
      attempts++;
      if (attempts < 3) throw new Error("fail");
      return "ok";
    }, { retries: 4 });
    expect(result).toBe("ok");
    expect(attempts).toBe(3);
  });

  it("should fail after max retries", async () => {
    let attempts = 0;
    await expect(
      withRetry(async () => {
        attempts++;
        throw new Error("fail");
      }, { retries: 2 })
    ).rejects.toThrow("fail");
    expect(attempts).toBe(3); // initial + 2 retries
  });
});
