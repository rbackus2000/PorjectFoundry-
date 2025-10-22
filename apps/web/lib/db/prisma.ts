import { PrismaClient } from "@prisma/client";

const key = "__prisma__" as const;

/**
 * Lazy-initialized Prisma client
 * Getter that only connects when first accessed to avoid blocking Next.js compilation
 */
function getPrismaClient(): PrismaClient {
  // @ts-ignore
  if (!globalThis[key]) {
    // @ts-ignore
    globalThis[key] = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
  // @ts-ignore
  return globalThis[key] as PrismaClient;
}

// Export as const with lazy getter so existing code doesn't need changes
export const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});
