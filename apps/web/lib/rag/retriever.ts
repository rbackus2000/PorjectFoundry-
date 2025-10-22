/**
 * RAG Retrieval utilities
 * Hybrid search combining vector similarity and full-text search
 */

import { supabase, DEFAULT_ORG_ID } from "./supabase";
import { embedQuery } from "./embedder";

export type RetrievalResult = {
  chunkId: string;
  docId: string;
  content: string;
  hybridScore: number;
  vecSim: number;
  ftRank: number;
  metadata: Record<string, any>;
  document?: {
    title: string;
    sourceUrl?: string;
    sourceType: string;
  };
};

export type RetrievalOptions = {
  orgId?: string;
  topK?: number;
  includeDocuments?: boolean;
};

/**
 * Retrieve chunks using hybrid search (0.7 vector + 0.3 full-text)
 */
export async function retrieveHybrid(
  query: string,
  options: RetrievalOptions = {}
): Promise<RetrievalResult[]> {
  const {
    orgId = DEFAULT_ORG_ID,
    topK = parseInt(process.env.RAG_TOP_K || "12", 10),
    includeDocuments = true,
  } = options;

  // Generate query embedding
  const queryEmbedding = await embedQuery(query);

  // Call Supabase RPC for hybrid search
  const { data, error } = await supabase.rpc("match_chunks_hybrid", {
    p_org_id: orgId,
    p_query: query,
    p_query_embedding: queryEmbedding,
    p_match_count: topK,
  });

  if (error) {
    throw new Error(`Hybrid search failed: ${error.message}`);
  }

  const results: RetrievalResult[] = (data || []).map((row: any) => ({
    chunkId: row.chunk_id,
    docId: row.doc_id,
    content: row.content,
    hybridScore: row.hybrid_score,
    vecSim: row.vec_sim,
    ftRank: row.ft_rank,
    metadata: row.metadata || {},
  }));

  // Optionally fetch document metadata
  if (includeDocuments && results.length > 0) {
    const chunkIds = results.map((r) => r.chunkId);
    const { data: docData, error: docError } = await supabase.rpc(
      "get_chunk_documents",
      {
        p_chunk_ids: chunkIds,
      }
    );

    if (!docError && docData) {
      const docMap = new Map(
        docData.map((d: any) => [
          d.chunk_id,
          {
            title: d.doc_title,
            sourceUrl: d.source_url,
            sourceType: d.source_type,
          },
        ])
      );

      results.forEach((result) => {
        result.document = docMap.get(result.chunkId) as {
          title: string;
          sourceUrl?: string;
          sourceType: string;
        } | undefined;
      });
    }
  }

  return results;
}

/**
 * Vector-only search (no full-text component)
 */
export async function retrieveVector(
  query: string,
  options: RetrievalOptions = {}
): Promise<RetrievalResult[]> {
  const {
    orgId = DEFAULT_ORG_ID,
    topK = parseInt(process.env.RAG_TOP_K || "12", 10),
    includeDocuments = true,
  } = options;

  const queryEmbedding = await embedQuery(query);

  const { data, error } = await supabase.rpc("match_chunks_vector", {
    p_org_id: orgId,
    p_query_embedding: queryEmbedding,
    p_match_count: topK,
  });

  if (error) {
    throw new Error(`Vector search failed: ${error.message}`);
  }

  const results: RetrievalResult[] = (data || []).map((row: any) => ({
    chunkId: row.chunk_id,
    docId: row.doc_id,
    content: row.content,
    hybridScore: row.similarity, // Use similarity as score
    vecSim: row.similarity,
    ftRank: 0,
    metadata: row.metadata || {},
  }));

  if (includeDocuments && results.length > 0) {
    const chunkIds = results.map((r) => r.chunkId);
    const { data: docData, error: docError } = await supabase.rpc(
      "get_chunk_documents",
      {
        p_chunk_ids: chunkIds,
      }
    );

    if (!docError && docData) {
      const docMap = new Map(
        docData.map((d: any) => [
          d.chunk_id,
          {
            title: d.doc_title,
            sourceUrl: d.source_url,
            sourceType: d.source_type,
          },
        ])
      );

      results.forEach((result) => {
        result.document = docMap.get(result.chunkId) as {
          title: string;
          sourceUrl?: string;
          sourceType: string;
        } | undefined;
      });
    }
  }

  return results;
}

/**
 * Log a query for analytics
 */
export async function logQuery(
  orgId: string,
  query: string,
  topK: number,
  usedHybrid: boolean = true
): Promise<void> {
  await supabase.from("rag_queries").insert({
    org_id: orgId,
    query_text: query,
    top_k: topK,
    used_hybrid: usedHybrid,
  });
}
