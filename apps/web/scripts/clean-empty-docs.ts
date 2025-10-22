#!/usr/bin/env tsx
/**
 * Clean Empty Documents
 * Delete documents that have 0 chunks (failed ingestions)
 */

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

import { supabase } from "../lib/rag/supabase";

async function main() {
  const orgId = process.env.RAG_DEFAULT_ORG_ID || "00000000-0000-0000-0000-000000000001";

  console.log("[Clean Empty Docs] Finding documents with 0 chunks...");

  // Get all documents
  const { data: docs, error: docsError } = await supabase
    .from("documents")
    .select("id, title")
    .eq("org_id", orgId);

  if (docsError) {
    console.error("Error fetching documents:", docsError.message);
    process.exit(1);
  }

  if (!docs || docs.length === 0) {
    console.log("No documents found.");
    return;
  }

  console.log(`Found ${docs.length} documents. Checking for empty ones...`);

  const emptyDocs: string[] = [];

  for (const doc of docs) {
    const { count } = await supabase
      .from("doc_chunks")
      .select("*", { count: "exact", head: true })
      .eq("doc_id", doc.id);

    if (count === 0) {
      console.log(`  - ${doc.title} (0 chunks) - will delete`);
      emptyDocs.push(doc.id);
    }
  }

  if (emptyDocs.length === 0) {
    console.log("\nNo empty documents found. All good!");
    return;
  }

  console.log(`\nDeleting ${emptyDocs.length} empty document(s)...`);

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .in("id", emptyDocs);

  if (deleteError) {
    console.error("Error deleting documents:", deleteError.message);
    process.exit(1);
  }

  console.log(`✓ Successfully deleted ${emptyDocs.length} empty document(s)`);
  console.log("\nYou can now re-run ingestion:");
  console.log("  npm run rag:ingest-dir -- --root ../../docs");
}

main().catch((error) => {
  console.error("[Clean Empty Docs] Error:", error);
  process.exit(1);
});
