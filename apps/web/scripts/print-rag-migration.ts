#!/usr/bin/env tsx
/**
 * Print RAG Migration Instructions
 * Since Supabase REST API doesn't support DDL execution,
 * this script prints the SQL for manual application via SQL Editor
 */

import fs from "fs/promises";
import path from "path";

async function main() {
  console.log("=".repeat(80));
  console.log("SUPABASE RAG MIGRATION - MANUAL APPLICATION REQUIRED");
  console.log("=".repeat(80));
  console.log("");
  console.log("The Supabase REST API does not support executing DDL statements.");
  console.log("Please follow these steps to apply the migration:");
  console.log("");
  console.log("1. Go to: https://supabase.com/dashboard/project/ttkkojdoydaadrlezeyi/sql");
  console.log("2. Click 'New Query'");
  console.log("3. Copy the SQL below");
  console.log("4. Paste into the SQL Editor");
  console.log("5. Click 'Run' or press Cmd+Enter");
  console.log("");
  console.log("=".repeat(80));
  console.log("SQL TO COPY:");
  console.log("=".repeat(80));
  console.log("");

  const migrationPath = path.join(__dirname, "../../../supabase/migrations/20251020_rag.sql");
  const sql = await fs.readFile(migrationPath, "utf-8");

  console.log(sql);

  console.log("");
  console.log("=".repeat(80));
  console.log("After running the migration, you can verify it worked by running:");
  console.log("  npm run rag:ingest-dir -- --root ../../docs");
  console.log("=".repeat(80));
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
