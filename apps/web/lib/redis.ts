import IORedis from "ioredis";

const key = "__redis__" as const;

/**
 * Lazy-initialized Redis client
 * Only connects when first accessed to avoid blocking Next.js compilation
 */
export function getRedis() {
  // @ts-ignore
  if (!globalThis[key]) {
    // @ts-ignore
    globalThis[key] = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
  }
  // @ts-ignore
  return globalThis[key] as IORedis;
}
