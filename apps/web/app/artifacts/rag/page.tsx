"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type SearchResult = {
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

export default function RAGSearchPage() {
  const [query, setQuery] = useState("");
  const [orgId, setOrgId] = useState("00000000-0000-0000-0000-000000000001");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rag/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, query }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Search failed");
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">RAG Search Dev Panel</h1>
        <p className="text-subtext mt-1">Test hybrid retrieval (0.7 vector + 0.3 full-text)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Parameters</CardTitle>
          <CardDescription>Query the RAG system with hybrid search</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Organization ID</label>
            <Input
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000001"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Query</label>
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Enter your search query..."
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading || !query.trim()}>
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results ({results.length})</CardTitle>
            <CardDescription>Retrieved chunks ranked by hybrid score</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result, idx) => (
              <div
                key={result.chunkId}
                className="border border-border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">#{idx + 1}</Badge>
                      {result.document && (
                        <>
                          <span className="text-sm font-medium">{result.document.title}</span>
                          <Badge variant="secondary">{result.document.sourceType}</Badge>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-subtext line-clamp-4">{result.content}</p>
                  </div>
                </div>

                <div className="flex gap-3 text-xs text-subtext pt-2 border-t border-border">
                  <div>
                    <span className="font-medium">Hybrid:</span> {result.hybridScore.toFixed(3)}
                  </div>
                  <div>
                    <span className="font-medium">Vector:</span> {result.vecSim.toFixed(3)}
                  </div>
                  <div>
                    <span className="font-medium">FT Rank:</span> {result.ftRank.toFixed(3)}
                  </div>
                  {result.document?.sourceUrl && (
                    <div className="ml-auto">
                      <a
                        href={result.document.sourceUrl}
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Source
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!loading && results.length === 0 && query && (
        <Card>
          <CardContent className="py-12 text-center text-subtext">
            No results found for &quot;{query}&quot;
          </CardContent>
        </Card>
      )}
    </div>
  );
}
