#!/usr/bin/env tsx
/**
 * RAG Single File Ingestion Script
 * Usage: tsx scripts/rag-ingest.ts --file <path> --org <org-id> [--title <title>]
 */

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { supabase, DEFAULT_ORG_ID } from "../lib/rag/supabase";
import { chunkText, estimateTokens } from "../lib/rag/chunker";
import { embedBatch } from "../lib/rag/embedder";

type IngestOptions = {
  filePath: string;
  orgId: string;
  title?: string;
};

async function main() {
  const args = parseArgs();

  console.log(`[RAG Ingest] Starting ingestion for: ${args.filePath}`);
  console.log(`[RAG Ingest] Organization: ${args.orgId}`);

  await ingestFile(args);

  console.log(`[RAG Ingest] Completed successfully`);
}

function parseArgs(): IngestOptions {
  const args = process.argv.slice(2);
  let filePath: string | undefined;
  let orgId = DEFAULT_ORG_ID;
  let title: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--file" && args[i + 1]) {
      filePath = args[i + 1];
      i++;
    } else if (args[i] === "--org" && args[i + 1]) {
      orgId = args[i + 1];
      i++;
    } else if (args[i] === "--title" && args[i + 1]) {
      title = args[i + 1];
      i++;
    }
  }

  if (!filePath) {
    console.error("Usage: tsx scripts/rag-ingest.ts --file <path> --org <org-id> [--title <title>]");
    process.exit(1);
  }

  return { filePath, orgId, title };
}

async function ingestFile(options: IngestOptions): Promise<void> {
  const { filePath, orgId, title } = options;

  // Read file
  const content = await fs.readFile(filePath, "utf-8");
  const stats = await fs.stat(filePath);
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  // Determine source type
  const sourceType = ext.replace(".", "") || "txt";

  // Compute SHA-256
  const sha256 = crypto.createHash("sha256").update(content).digest("hex");

  // Check if document already exists
  const { data: existingDoc } = await supabase
    .from("documents")
    .select("id")
    .eq("org_id", orgId)
    .eq("sha256", sha256)
    .single();

  if (existingDoc) {
    console.log(`[RAG Ingest] Document already exists (SHA256: ${sha256.slice(0, 8)}...)`);
    console.log(`[RAG Ingest] Skipping ingestion`);
    return;
  }

  // Insert document
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({
      org_id: orgId,
      title: title || fileName,
      source_url: filePath,
      source_type: sourceType,
      mime: `text/${sourceType}`,
      sha256,
      bytes: stats.size,
    })
    .select("id")
    .single();

  if (docError || !doc) {
    throw new Error(`Failed to insert document: ${docError?.message}`);
  }

  console.log(`[RAG Ingest] Document created: ${doc.id}`);

  // Chunk the content
  const chunks = chunkText(content);
  console.log(`[RAG Ingest] Generated ${chunks.length} chunks`);

  if (chunks.length === 0) {
    console.warn(`[RAG Ingest] No chunks generated for ${fileName}`);
    return;
  }

  // Embed chunks in batches
  const BATCH_SIZE = 100;
  const chunkRecords: any[] = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    console.log(`[RAG Ingest] Embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}...`);

    const embeddings = await embedBatch(batch.map((c) => c.content));

    for (let j = 0; j < batch.length; j++) {
      chunkRecords.push({
        org_id: orgId,
        doc_id: doc.id,
        chunk_index: batch[j].index,
        content: batch[j].content,
        token_count: batch[j].tokenCount,
        embedding: embeddings[j].embedding,
        metadata: {
          fileName,
          sourceType,
        },
      });
    }
  }

  // Insert chunks
  console.log(`[RAG Ingest] Inserting ${chunkRecords.length} chunks...`);
  console.log(`[Debug] Sample chunk:`, JSON.stringify(chunkRecords[0], null, 2).substring(0, 600));

  const { error: chunkError } = await supabase.from("doc_chunks").insert(chunkRecords);

  if (chunkError) {
    console.error(`[Debug] Full error:`, JSON.stringify(chunkError, null, 2));
    throw new Error(`Failed to insert chunks: ${chunkError.message}`);
  }

  console.log(`[RAG Ingest] ✓ Ingested ${chunks.length} chunks from ${fileName}`);
  console.log(`[RAG Ingest] Document ID: ${doc.id}`);
}

main().catch((error) => {
  console.error(`[RAG Ingest] Error:`, error);
  process.exit(1);
});
