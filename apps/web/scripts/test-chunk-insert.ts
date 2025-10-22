#!/usr/bin/env tsx
/**
 * Test Chunk Insert
 * Test inserting a single chunk to isolate JSON/metadata issues
 */

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

import { supabase } from "../lib/rag/supabase";

async function main() {
  const orgId = "00000000-0000-0000-0000-000000000001";

  console.log("[Test] Creating test document...");

  // Create a test document
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({
      org_id: orgId,
      title: "Test Document",
      source_url: "/test.md",
      source_type: "md",
      mime: "text/md",
      sha256: "test123",
      bytes: 100,
    })
    .select("id")
    .single();

  if (docError || !doc) {
    console.error("Failed to create document:", docError?.message);
    process.exit(1);
  }

  console.log(`[Test] Document created: ${doc.id}`);

  // Create a test embedding (1536 dimensions, all zeros for simplicity)
  const testEmbedding = new Array(1536).fill(0);

  console.log("[Test] Inserting test chunk...");

  // Try inserting a chunk
  const { error: chunkError } = await supabase.from("doc_chunks").insert({
    org_id: orgId,
    doc_id: doc.id,
    chunk_index: 0,
    content: "This is a test chunk.",
    token_count: 5,
    embedding: testEmbedding,
    metadata: {
      fileName: "test.md",
      sourceType: "md",
    },
  });

  if (chunkError) {
    console.error("[Test] Failed to insert chunk:", chunkError.message);
    console.error("[Test] Full error:", JSON.stringify(chunkError, null, 2));
  } else {
    console.log("[Test] ✓ Chunk inserted successfully!");
  }

  // Cleanup
  console.log("[Test] Cleaning up...");
  await supabase.from("documents").delete().eq("id", doc.id);
  console.log("[Test] Done!");
}

main().catch((error) => {
  console.error("[Test] Error:", error);
  process.exit(1);
});
