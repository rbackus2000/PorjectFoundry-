#!/usr/bin/env tsx
/**
 * Apply Supabase RAG Migration
 * Runs the SQL migration to create RAG tables, indexes, and functions
 */

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

import fs from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log("[RAG Migration] Reading migration file...");
  const migrationPath = path.join(__dirname, "../../../supabase/migrations/20251020_rag.sql");
  const sql = await fs.readFile(migrationPath, "utf-8");

  console.log("[RAG Migration] Applying migration to Supabase...");
  console.log("[RAG Migration] This will execute the SQL directly via POST API");
  console.log("");

  // Use Supabase REST API to execute raw SQL
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": serviceRoleKey,
      "Authorization": `Bearer ${serviceRoleKey}`,
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({
      query: sql,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[RAG Migration] Failed to apply migration:");
    console.error(errorText);
    process.exit(1);
  }

  console.log("[RAG Migration] Migration applied successfully!");
  console.log("");
  console.log("[RAG Migration] Verifying tables...");

  // Verify tables were created
  const { data: tables, error: tablesError } = await supabase
    .from("documents")
    .select("count")
    .limit(0);

  if (tablesError) {
    console.warn("[RAG Migration] Warning: Could not verify 'documents' table");
    console.warn(tablesError.message);
  } else {
    console.log("[RAG Migration] ✓ Documents table verified");
  }

  const { data: chunks, error: chunksError } = await supabase
    .from("doc_chunks")
    .select("count")
    .limit(0);

  if (chunksError) {
    console.warn("[RAG Migration] Warning: Could not verify 'doc_chunks' table");
    console.warn(chunksError.message);
  } else {
    console.log("[RAG Migration] ✓ Doc chunks table verified");
  }

  console.log("");
  console.log("[RAG Migration] Migration complete!");
}

main().catch((error) => {
  console.error("[RAG Migration] Fatal error:", error);
  process.exit(1);
});
