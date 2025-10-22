#!/usr/bin/env tsx
/**
 * Check RAG Data
 * Verify documents and chunks were ingested successfully
 */

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

import { supabase } from "../lib/rag/supabase";

async function main() {
  const orgId = "00000000-0000-0000-0000-000000000001";

  console.log("[Check RAG Data] Checking documents...");

  // Check documents
  const { data: docs, error: docsError } = await supabase
    .from("documents")
    .select("id, title, source_type, bytes, created_at")
    .eq("org_id", orgId);

  if (docsError) {
    console.error("Error fetching documents:", docsError.message);
    return;
  }

  console.log(`\n[Documents] Found ${docs?.length || 0} documents:`);
  docs?.forEach((doc, idx) => {
    console.log(`  ${idx + 1}. ${doc.title} (${doc.source_type}, ${doc.bytes} bytes)`);
  });

  if (!docs || docs.length === 0) {
    console.log("\nNo documents found. Run ingestion first.");
    return;
  }

  // Check chunks for each document
  console.log("\n[Chunks] Checking chunks per document:");
  for (const doc of docs) {
    const { count, error: countError } = await supabase
      .from("doc_chunks")
      .select("*", { count: "exact", head: true })
      .eq("doc_id", doc.id);

    if (countError) {
      console.error(`  Error counting chunks for ${doc.title}:`, countError.message);
    } else {
      console.log(`  ${doc.title}: ${count} chunks`);
    }
  }

  console.log("\n[Check RAG Data] Done!");
}

main().catch((error) => {
  console.error("[Check RAG Data] Error:", error);
  process.exit(1);
});
