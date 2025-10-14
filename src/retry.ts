import pRetry from "p-retry";

export async function withRetry<T>(fn: () => Promise<T>, opts?: { retries?: number; factor?: number }) {
  const r = opts?.retries ?? 3;
  const factor = opts?.factor ?? 2;
  return pRetry(fn, { retries: r, factor });
}
