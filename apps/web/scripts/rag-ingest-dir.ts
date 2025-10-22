#!/usr/bin/env tsx
/**
 * RAG Directory Ingestion Script
 * Recursively ingest all supported files in a directory
 * Usage: tsx scripts/rag-ingest-dir.ts --root <dir> --org <org-id>
 */

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { supabase, DEFAULT_ORG_ID } from "../lib/rag/supabase";
import { chunkText } from "../lib/rag/chunker";
import { embedBatch } from "../lib/rag/embedder";

type IngestDirOptions = {
  rootDir: string;
  orgId: string;
};

const SUPPORTED_EXTENSIONS = [".md", ".txt", ".html"];
const BATCH_SIZE = 100;

async function main() {
  const args = parseArgs();

  console.log(`[RAG Ingest Dir] Starting directory ingestion`);
  console.log(`[RAG Ingest Dir] Root: ${args.rootDir}`);
  console.log(`[RAG Ingest Dir] Organization: ${args.orgId}`);
  console.log(`[RAG Ingest Dir] Supported: ${SUPPORTED_EXTENSIONS.join(", ")}`);
  console.log("");

  const stats = await ingestDirectory(args);

  console.log("");
  console.log(`[RAG Ingest Dir] === Summary ===`);
  console.log(`[RAG Ingest Dir] Total files found: ${stats.totalFiles}`);
  console.log(`[RAG Ingest Dir] Successfully ingested: ${stats.ingested}`);
  console.log(`[RAG Ingest Dir] Skipped (duplicate): ${stats.skipped}`);
  console.log(`[RAG Ingest Dir] Skipped (unsupported): ${stats.unsupported}`);
  console.log(`[RAG Ingest Dir] Errors: ${stats.errors}`);
}

function parseArgs(): IngestDirOptions {
  const args = process.argv.slice(2);
  let rootDir: string | undefined;
  let orgId = DEFAULT_ORG_ID;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--root" && args[i + 1]) {
      rootDir = args[i + 1];
      i++;
    } else if (args[i] === "--org" && args[i + 1]) {
      orgId = args[i + 1];
      i++;
    }
  }

  if (!rootDir) {
    console.error("Usage: tsx scripts/rag-ingest-dir.ts --root <dir> --org <org-id>");
    process.exit(1);
  }

  return { rootDir, orgId };
}

type IngestionStats = {
  totalFiles: number;
  ingested: number;
  skipped: number;
  unsupported: number;
  errors: number;
};

async function ingestDirectory(options: IngestDirOptions): Promise<IngestionStats> {
  const stats: IngestionStats = {
    totalFiles: 0,
    ingested: 0,
    skipped: 0,
    unsupported: 0,
    errors: 0,
  };

  const files = await walkDirectory(options.rootDir);
  stats.totalFiles = files.length;

  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);

    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      console.log(`[Skip] ${fileName} (unsupported: ${ext})`);
      stats.unsupported++;
      continue;
    }

    try {
      const result = await ingestFile(filePath, options.orgId);
      if (result === "ingested") {
        stats.ingested++;
      } else if (result === "skipped") {
        stats.skipped++;
      }
    } catch (error: any) {
      console.error(`[Error] ${fileName}: ${error.message}`);
      stats.errors++;
    }
  }

  return stats;
}

async function walkDirectory(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentPath: string) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules, .git, etc.
        if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
          await walk(fullPath);
        }
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  await walk(dir);
  return files;
}

async function ingestFile(filePath: string, orgId: string): Promise<"ingested" | "skipped"> {
  const fileName = path.basename(filePath);

  // Read file
  const content = await fs.readFile(filePath, "utf-8");
  const stats = await fs.stat(filePath);
  const ext = path.extname(filePath).toLowerCase();
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
    console.log(`[Skip] ${fileName} (duplicate)`);
    return "skipped";
  }

  // Insert document
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({
      org_id: orgId,
      title: fileName,
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

  // Chunk the content
  const chunks = chunkText(content);

  if (chunks.length === 0) {
    console.warn(`[Warn] ${fileName} produced no chunks`);
    return "ingested";
  }

  // Embed chunks in batches
  const chunkRecords: any[] = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
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
          relativePath: path.relative(process.cwd(), filePath),
        },
      });
    }
  }

  // Insert chunks
  console.log(`[Debug] Attempting to insert ${chunkRecords.length} chunks...`);
  if (chunkRecords.length > 0) {
    console.log(`[Debug] Sample chunk record:`, JSON.stringify(chunkRecords[0], null, 2).substring(0, 500));
  }

  const { error: chunkError } = await supabase.from("doc_chunks").insert(chunkRecords);

  if (chunkError) {
    console.error(`[Debug] Chunk error details:`, JSON.stringify(chunkError, null, 2));
    throw new Error(`Failed to insert chunks: ${chunkError.message}`);
  }

  console.log(`[OK] ${fileName} (${chunks.length} chunks)`);
  return "ingested";
}

main().catch((error) => {
  console.error(`[RAG Ingest Dir] Fatal error:`, error);
  process.exit(1);
});
