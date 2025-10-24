"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import to avoid SSR issues with ReactFlow
const CanvasFlow = dynamic(() => import("@/features/canvas/CanvasFlow"), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100vh-200px)] flex items-center justify-center border border-border rounded-lg">
      <p className="text-subtext">Loading canvas...</p>
    </div>
  ),
});

export default function CanvasPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [projectTitle, setProjectTitle] = useState("");
  const [graphData, setGraphData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGraph() {
      if (!projectId) {
        setError("No project selected");
        setIsLoading(false);
        return;
      }

      try {
        console.log("🔄 Fetching canvas data for project:", projectId);
        const response = await fetch(`/api/canvas?projectId=${projectId}`, {
          cache: 'no-store', // Disable caching to always get fresh data
        });
        if (!response.ok) {
          throw new Error("Failed to fetch canvas data");
        }

        const data = await response.json();
        console.log("📊 Received canvas data:", {
          title: data.projectTitle,
          nodeCount: data.graph?.nodes?.length || 0,
          edgeCount: data.graph?.edges?.length || 0,
          firstNode: data.graph?.nodes?.[0],
        });
        setProjectTitle(data.projectTitle);
        setGraphData(data.graph);
      } catch (err) {
        console.error("Error fetching canvas data:", err);
        setError("Failed to load canvas");
      } finally {
        setIsLoading(false);
      }
    }

    fetchGraph();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-9 w-64 mx-auto" />
          <Skeleton className="h-4 w-96 mt-2 mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !graphData) {
    return (
      <div className="h-full w-full flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight mb-4">Module Canvas</h1>
          <div className="border border-border rounded-lg p-6 bg-surface">
            <p className="text-error">{error || "Canvas not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] w-full flex flex-col">
      <CanvasFlow projectId={projectId!} projectTitle={projectTitle} initialGraph={graphData} />
    </div>
  );
}
