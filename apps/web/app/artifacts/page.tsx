"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { MermaidChart } from "@/components/ui/mermaid-chart";
import { RefreshCw } from "lucide-react";

const tabItems = [
  { value: "master", label: "Master Prompt" },
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
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Master prompt state
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["web"]);
  const [masterPrompt, setMasterPrompt] = useState<string | null>(null);
  const [isGeneratingMaster, setIsGeneratingMaster] = useState(false);

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
  const getUISpec = () => getArtifact("UISpec");
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

  const handleRegenerate = async () => {
    if (!projectId) return;

    const confirmed = confirm(
      "Regenerate all artifacts? This will update all diagrams, specs, and prompt packs based on current project data."
    );

    if (!confirmed) return;

    setIsRegenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate artifacts");
      }

      // Refetch the updated artifacts
      const artifactsResponse = await fetch(`/api/artifacts?projectId=${projectId}`);
      if (artifactsResponse.ok) {
        const data = await artifactsResponse.json();
        setArtifacts(data.artifacts);
      }

      alert("Artifacts regenerated successfully!");
    } catch (error) {
      console.error("Error regenerating artifacts:", error);
      alert("Failed to regenerate artifacts. Please check your network connection and API key.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleGenerateMasterPrompt = async () => {
    if (!projectId) return;

    setIsGeneratingMaster(true);

    try {
      const response = await fetch("/api/master-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, platforms: selectedPlatforms }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate master prompt");
      }

      const data = await response.json();
      setMasterPrompt(data.prompt);
    } catch (error) {
      console.error("Error generating master prompt:", error);
      alert(error instanceof Error ? error.message : "Failed to generate master prompt");
    } finally {
      setIsGeneratingMaster(false);
    }
  };

  const handleDownloadMasterPrompt = () => {
    if (!masterPrompt) return;

    const platformSuffix = selectedPlatforms.join("-");
    const filename = `${projectTitle.toLowerCase().replace(/\s+/g, "-")}-master-prompt-${platformSuffix}.md`;

    const blob = new Blob([masterPrompt], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) {
        // Don't allow removing the last platform
        if (prev.length === 1) return prev;
        return prev.filter((p) => p !== platform);
      } else {
        return [...prev, platform];
      }
    });
    // Clear generated prompt when platforms change
    setMasterPrompt(null);
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

      <Tabs defaultValue="master" className="w-full">
        <TabsList>
          {tabItems.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="master" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Master Prompt - IDE Ready</CardTitle>
              <CardDescription>
                Generate a comprehensive, AI-ready prompt that combines all your project artifacts.
                Perfect for Cursor, Claude Code, or any AI IDE.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Select Target Platform(s)</h3>
                <div className="flex gap-3">
                  {["web", "ios", "android"].map((platform) => (
                    <Button
                      key={platform}
                      variant={selectedPlatforms.includes(platform) ? "default" : "outline"}
                      onClick={() => togglePlatform(platform)}
                      className="capitalize"
                    >
                      {platform === "web" ? "Web App" : platform === "ios" ? "iOS App" : "Android App"}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Select one or more platforms. The prompt will adapt to include platform-specific build instructions.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleGenerateMasterPrompt}
                  disabled={isGeneratingMaster || selectedPlatforms.length === 0}
                >
                  {isGeneratingMaster ? "Generating..." : "Generate Master Prompt"}
                </Button>
                {masterPrompt && (
                  <Button variant="outline" onClick={handleDownloadMasterPrompt}>
                    Download .md File
                  </Button>
                )}
              </div>

              {masterPrompt && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Generated Prompt Preview</h3>
                    <span className="text-xs text-muted-foreground">
                      {masterPrompt.length.toLocaleString()} characters
                    </span>
                  </div>
                  <div className="bg-surface border border-border rounded-lg p-4 overflow-x-auto max-h-[600px] overflow-y-auto">
                    <pre className="text-sm font-mono whitespace-pre-wrap">{masterPrompt}</pre>
                  </div>
                </div>
              )}

              {!masterPrompt && !isGeneratingMaster && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Select your target platform(s) and click "Generate Master Prompt" to create your IDE-ready prompt.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flows" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Flow Diagrams</CardTitle>
                  <CardDescription>Mermaid flowcharts generated from your project graph</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  title="Regenerate all artifacts"
                >
                  <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {getMermaidFlow() ? (
                <div className="space-y-4">
                  <MermaidChart chart={getMermaidFlow()!.content} />
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Entity Relationship Diagram</CardTitle>
                  <CardDescription>Database schema from backend spec</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  title="Regenerate all artifacts"
                >
                  <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {getMermaidERD() ? (
                <div className="space-y-4">
                  <MermaidChart chart={getMermaidERD()!.content} />
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
