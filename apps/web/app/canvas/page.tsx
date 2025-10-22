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
        const response = await fetch(`/api/canvas?projectId=${projectId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch canvas data");
        }

        const data = await response.json();
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
      <div className="space-y-4">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96 mt-1" />
        </div>
        <Skeleton className="h-[calc(100vh-300px)] rounded-lg" />
      </div>
    );
  }

  if (error || !graphData) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Module Canvas</h1>
        </div>
        <div className="border border-border rounded-lg p-6 bg-surface">
          <p className="text-error">{error || "Canvas not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[2400px] mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Module Canvas</h1>
        <p className="text-subtext mt-1">{projectTitle}</p>
      </div>

      <CanvasFlow projectId={projectId!} projectTitle={projectTitle} initialGraph={graphData} />
    </div>
  );
}
