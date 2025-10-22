"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

const tabItems = [
  { value: "flows", label: "Mermaid (Flows)" },
  { value: "erd", label: "ERD" },
  { value: "packs", label: "Prompt Packs" },
  { value: "uispec", label: "UI Spec" },
] as const;

type Artifact = {
  id: string;
  type: string;
  content: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export default function ArtifactsPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [projectTitle, setProjectTitle] = useState("");
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArtifacts() {
      if (!projectId) {
        setError("No project selected");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/artifacts?projectId=${projectId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch artifacts");
        }

        const data = await response.json();
        setProjectTitle(data.projectTitle);
        setArtifacts(data.artifacts);
      } catch (err) {
        console.error("Error fetching artifacts:", err);
        setError("Failed to load artifacts");
      } finally {
        setIsLoading(false);
      }
    }

    fetchArtifacts();
  }, [projectId]);

  // Helper functions to find artifacts by type
  const getArtifact = (type: string) => artifacts.find(a => a.type === type);
  const getMermaidFlow = () => getArtifact("Mermaid_Flow");
  const getMermaidERD = () => getArtifact("Mermaid_ERD");
  const getUISpec = () => getArtifact("UI_SPEC");
  const getPromptPacks = () => artifacts.filter(a => a.type.startsWith("PromptPack_"));

  const handleDownload = (artifact: Artifact, filename: string) => {
    const blob = new Blob([artifact.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (error || !projectId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Artifacts</h1>
          <p className="text-subtext mt-1">Generated outputs and exports</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-error">{error || "No project selected"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[2400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Artifacts</h1>
          <p className="text-subtext mt-1">{projectTitle}</p>
        </div>
      </div>

      <Tabs defaultValue="flows" className="w-full">
        <TabsList>
          {tabItems.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="flows" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Flow Diagrams</CardTitle>
              <CardDescription>Mermaid flowcharts generated from your project graph</CardDescription>
            </CardHeader>
            <CardContent>
              {getMermaidFlow() ? (
                <div className="space-y-4">
                  <div className="bg-surface border border-border rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm font-mono whitespace-pre">{getMermaidFlow()!.content}</pre>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(getMermaidFlow()!, "flowchart.mmd")}
                  >
                    Download Mermaid File
                  </Button>
                </div>
              ) : (
                <EmptyState
                  icon="🌊"
                  title="No Flowchart Yet"
                  description="Flowchart artifacts are generated during project creation. This project may not have a flowchart generated yet."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="erd" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Entity Relationship Diagram</CardTitle>
              <CardDescription>Database schema from backend spec</CardDescription>
            </CardHeader>
            <CardContent>
              {getMermaidERD() ? (
                <div className="space-y-4">
                  <div className="bg-surface border border-border rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm font-mono whitespace-pre">{getMermaidERD()!.content}</pre>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(getMermaidERD()!, "erd.mmd")}
                  >
                    Download Mermaid File
                  </Button>
                </div>
              ) : (
                <EmptyState
                  icon="🗄️"
                  title="No ERD Yet"
                  description="ERD artifacts are generated during project creation. This project may not have an ERD generated yet."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Prompt Packs</CardTitle>
              <CardDescription>Download ready-to-use prompt packs for various AI tools</CardDescription>
            </CardHeader>
            <CardContent>
              {getPromptPacks().length > 0 ? (
                <div className="grid gap-3">
                  {getPromptPacks().map((pack) => {
                    const toolName = pack.type.replace("PromptPack_", "");
                    return (
                      <div
                        key={pack.id}
                        className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{toolName}</p>
                          <p className="text-sm text-subtext">Version {pack.version}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(pack, `${toolName}_prompt_pack.txt`)}
                        >
                          Download
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon="📦"
                  title="No Prompt Packs Yet"
                  description="Prompt packs are generated during project creation. This project may not have prompt packs generated yet."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="uispec" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>UI Specification</CardTitle>
              <CardDescription>Structured UI spec for Figma plugin</CardDescription>
            </CardHeader>
            <CardContent>
              {getUISpec() ? (
                <div className="space-y-4">
                  <div className="bg-surface border border-border rounded-lg p-4 overflow-x-auto max-h-[600px]">
                    <pre className="text-sm font-mono whitespace-pre">{JSON.stringify(JSON.parse(getUISpec()!.content), null, 2)}</pre>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(getUISpec()!, "ui_spec.json")}
                  >
                    Download JSON
                  </Button>
                </div>
              ) : (
                <EmptyState
                  icon="🎨"
                  title="No UI Spec Yet"
                  description="UI specifications are generated during project creation. This project may not have a UI spec generated yet."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
