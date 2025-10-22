import { NextRequest, NextResponse } from "next/server";
import { retrieveHybrid } from "@/lib/rag/retriever";
import { logQuery } from "@/lib/rag/retriever";

export const runtime = "nodejs";

/**
 * POST /api/rag/search
 * Perform hybrid RAG search
 *
 * Body: { orgId: string, query: string, topK?: number }
 * Returns: { results: RetrievalResult[], query: string, orgId: string, count: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, query, topK } = body;

    if (!orgId || !query) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, query" },
        { status: 400 }
      );
    }

    // Perform hybrid search
    const results = await retrieveHybrid(query, { orgId, topK, includeDocuments: true });

    // Log query for analytics
    await logQuery(orgId, query, topK || 12, true);

    return NextResponse.json({
      results,
      query,
      orgId,
      count: results.length,
    });
  } catch (error: any) {
    console.error("[API /rag/search] Error:", error);
    return NextResponse.json(
      { error: error.message || "Search failed" },
      { status: 500 }
    );
  }
}
