import { ResearchReport } from "../zodSchemas";
import { retrieveHybrid } from "../rag/retriever";
import { embed } from "../rag/embedder";

/**
 * Research Agent
 * Conducts research and returns structured insights with citations
 */

export type ResearchInput = {
  query: string;
  topics?: string[];
  useRAG?: boolean;
  orgId?: string;
};

/**
 * conductResearch - Main entry point for research pipeline
 */
export async function conductResearch(input: ResearchInput): Promise<ResearchReport> {
  const { query, useRAG = true, orgId } = input;

  // Step 1: Query Planning - Break down complex queries
  const subQueries = await planQuery(query);

  // Step 2: Retrieval - Use RAG if enabled
  let allResults: any[] = [];
  if (useRAG && orgId) {
    for (const subQuery of subQueries) {
      const results = await retrieveHybrid(subQuery, {
        orgId,
        topK: 5,
        includeDocuments: true,
      });
      allResults.push(...results);
    }
  }

  // Step 3: Synthesis - Combine and summarize findings
  const insights = await synthesizeInsights(query, allResults);

  const report: ResearchReport = {
    query,
    insights,
    generatedAt: new Date().toISOString(),
  };

  return report;
}

/**
 * Query planner: breaks down complex queries into sub-queries
 */
export async function planQuery(query: string): Promise<string[]> {
  // Simple heuristic query planner
  // In production, this could use an LLM to intelligently decompose queries

  const lowercaseQuery = query.toLowerCase();

  // Check for "and" to split compound queries
  if (lowercaseQuery.includes(" and ")) {
    return query.split(/\s+and\s+/i).map((q) => q.trim());
  }

  // Check for common multi-part patterns
  if (lowercaseQuery.match(/best practices|how to|what are|examples of/)) {
    // These are typically singular focused queries
    return [query];
  }

  // If query mentions multiple topics, split them
  const topics = extractTopics(query);
  if (topics.length > 1) {
    return topics.map((topic) => `${topic} ${query.split(" ").slice(-3).join(" ")}`);
  }

  return [query];
}

/**
 * Extract potential topics from a query
 */
function extractTopics(query: string): string[] {
  // Simple keyword extraction - in production use NLP
  const words = query.split(/\s+/);
  const stopWords = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for"]);

  const topics = words
    .filter((word) => word.length > 3 && !stopWords.has(word.toLowerCase()))
    .slice(0, 3); // Limit to 3 main topics

  return topics.length > 0 ? topics : [query];
}

/**
 * Synthesize insights from retrieved documents
 */
async function synthesizeInsights(
  query: string,
  results: any[]
): Promise<ResearchReport["insights"]> {
  // Group results by topic/document
  const grouped = groupByDocument(results);

  const insights = grouped.map((group) => ({
    topic: group.topic,
    summary: summarizeGroup(group),
    citations: group.results.map((r: any, idx: number) => ({
      id: `cite-${group.topic}-${idx}`,
      source: r.document?.title || "Unknown Source",
      url: r.document?.sourceUrl,
      snippet: r.content.substring(0, 200) + "...",
      relevance: r.hybridScore || 0.5,
    })),
  }));

  return insights;
}

/**
 * Group results by document/topic
 */
function groupByDocument(results: any[]): Array<{ topic: string; results: any[] }> {
  const groups = new Map<string, any[]>();

  results.forEach((result) => {
    const topic = result.document?.title || "General Findings";
    if (!groups.has(topic)) {
      groups.set(topic, []);
    }
    groups.get(topic)!.push(result);
  });

  return Array.from(groups.entries()).map(([topic, results]) => ({ topic, results }));
}

/**
 * Summarize a group of related results
 */
function summarizeGroup(group: { topic: string; results: any[] }): string {
  // Simple extractive summary - take top snippets
  const topSnippets = group.results
    .sort((a, b) => (b.hybridScore || 0) - (a.hybridScore || 0))
    .slice(0, 3)
    .map((r) => r.content.substring(0, 150))
    .join(". ");

  return topSnippets || `Key insights about ${group.topic} based on available documentation.`;
}

/**
 * Crawler interface (placeholder for future web scraping)
 */
export async function crawlURL(url: string): Promise<string> {
  // TODO: Integrate with web scraping service like Puppeteer or Cheerio
  // For now, return a placeholder
  console.warn(`[Research] Crawling not yet implemented for ${url}`);
  return `Placeholder content from ${url}`;
}

/**
 * Export existing researchAgent for backwards compatibility
 */
export const researchAgent = {
  generate: conductResearch,
  planQuery,
  crawl: crawlURL,
  embed,
  synthesize: async (sources: Array<{ text: string; url: string }>): Promise<ResearchReport> => {
    const mockResults = sources.map((source) => ({
      content: source.text,
      document: { title: "Web Source", sourceUrl: source.url },
      hybridScore: 0.8,
    }));

    const insights = await synthesizeInsights("Synthesized research", mockResults);

    return {
      query: "Synthesized research from multiple sources",
      insights,
      generatedAt: new Date().toISOString(),
    };
  },
};
