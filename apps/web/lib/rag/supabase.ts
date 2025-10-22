import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client for RAG operations
 * Uses service role key for server-side operations (ingestion, retrieval)
 * Lazy-initialized to avoid blocking Next.js compilation
 */

const key = "__supabase__" as const;

function getSupabaseClient(): SupabaseClient {
  // @ts-ignore
  if (!globalThis[key]) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      throw new Error("Missing SUPABASE_URL environment variable");
    }

    if (!supabaseServiceKey) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
    }

    // @ts-ignore
    globalThis[key] = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  // @ts-ignore
  return globalThis[key] as SupabaseClient;
}

// Export as const with lazy getter so existing code doesn't need changes
export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

export const DEFAULT_ORG_ID =
  process.env.RAG_DEFAULT_ORG_ID || "00000000-0000-0000-0000-000000000001";
