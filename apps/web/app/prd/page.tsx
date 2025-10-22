"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { EnhancedPRDViewer } from "@/components/EnhancedPRDViewer";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { PRD } from "@/lib/zodSchemas";

export default function PRDPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [prd, setPrd] = useState<PRD | null>(null);
  const [editedPrd, setEditedPrd] = useState<PRD | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPRD() {
      if (!projectId) {
        setError("No project selected");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/prd?projectId=${projectId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch PRD");
        }

        const data = await response.json();
        setPrd(data.prd);
        setProjectTitle(data.projectTitle);
      } catch (err) {
        console.error("Error fetching PRD:", err);
        setError("Failed to load PRD");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPRD();
  }, [projectId]);

  const handleRegenerate = async () => {
    if (!projectId) return;

    const confirmed = confirm(
      "Are you sure you want to regenerate the PRD? This will create a new version based on the project's current data."
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
        throw new Error("Failed to regenerate PRD");
      }

      // Refetch the updated PRD
      const prdResponse = await fetch(`/api/prd?projectId=${projectId}`);
      if (prdResponse.ok) {
        const data = await prdResponse.json();
        setPrd(data.prd);
        setProjectTitle(data.projectTitle);
      }

      alert("PRD regenerated successfully!");
    } catch (error) {
      console.error("Error regenerating PRD:", error);
      alert("Failed to regenerate PRD. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleEdit = () => {
    if (!prd) return;
    setEditedPrd(JSON.parse(JSON.stringify(prd))); // Deep copy
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedPrd(null);
  };

  const handleSave = async () => {
    if (!projectId || !editedPrd) return;

    setIsSaving(true);

    try {
      const response = await fetch(`/api/prd/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          prd: editedPrd,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save PRD");
      }

      setPrd(editedPrd);
      setIsEditing(false);
      setEditedPrd(null);
      alert("PRD saved successfully!");
    } catch (error) {
      console.error("Error saving PRD:", error);
      alert("Failed to save PRD. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    if (!prd) return;

    // Convert PRD to markdown
    let markdown = `# ${prd.title}\n\n`;
    markdown += `**Version:** ${prd.version}\n`;
    markdown += `**Last Updated:** ${prd.lastUpdated}\n\n`;

    markdown += `## Overview\n\n${prd.overview}\n\n`;

    if (prd.problemStatement) {
      markdown += `## Problem Statement\n\n${prd.problemStatement}\n\n`;
    }

    markdown += `## Goals\n\n${prd.goals.map(g => `- ${g}`).join("\n")}\n\n`;

    if (prd.nonGoals && prd.nonGoals.length > 0) {
      markdown += `## Non-Goals\n\n${prd.nonGoals.map(g => `- ${g}`).join("\n")}\n\n`;
    }

    if (prd.userPersonas && prd.userPersonas.length > 0) {
      markdown += `## User Personas\n\n`;
      prd.userPersonas.forEach(persona => {
        markdown += `### ${persona.name} - ${persona.role}\n\n`;
        markdown += `**Goals:**\n${persona.goals.map(g => `- ${g}`).join("\n")}\n\n`;
        markdown += `**Pain Points:**\n${persona.painPoints.map(p => `- ${p}`).join("\n")}\n\n`;
        if (persona.useCases && persona.useCases.length > 0) {
          markdown += `**Use Cases:**\n${persona.useCases.map(u => `- ${u}`).join("\n")}\n\n`;
        }
      });
    }

    if (prd.competitiveAnalysis) {
      markdown += `## Competitive Analysis\n\n`;
      prd.competitiveAnalysis.competitors.forEach(comp => {
        markdown += `### ${comp.name}\n\n`;
        markdown += `**Strengths:**\n${comp.strengths.map(s => `- ${s}`).join("\n")}\n\n`;
        markdown += `**Weaknesses:**\n${comp.weaknesses.map(w => `- ${w}`).join("\n")}\n\n`;
        if (comp.differentiators && comp.differentiators.length > 0) {
          markdown += `**Our Differentiators:**\n${comp.differentiators.map(d => `- ${d}`).join("\n")}\n\n`;
        }
      });
      if (prd.competitiveAnalysis.marketOpportunity) {
        markdown += `**Market Opportunity:** ${prd.competitiveAnalysis.marketOpportunity}\n\n`;
      }
    }

    if (prd.successMetrics && prd.successMetrics.length > 0) {
      markdown += `## Success Metrics\n\n`;
      prd.successMetrics.forEach(metric => {
        markdown += `### ${metric.metric}\n\n`;
        if (metric.target) markdown += `**Target:** ${metric.target}\n\n`;
        if (metric.baseline) markdown += `**Baseline:** ${metric.baseline}\n\n`;
        if (metric.timeframe) markdown += `**Timeframe:** ${metric.timeframe}\n\n`;
      });
    }

    markdown += `## User Stories\n\n`;
    prd.userStories.forEach(story => {
      markdown += `### ${story.story}\n\n`;
      markdown += `**Persona:** ${story.persona}\n\n`;
      if (story.acceptanceCriteria.length > 0) {
        markdown += `**Acceptance Criteria:**\n${story.acceptanceCriteria.map(c => `- ${c}`).join("\n")}\n\n`;
      }
    });

    markdown += `## Features\n\n`;
    ["P0", "P1", "P2", "P3"].forEach(priority => {
      const features = prd.features.filter(f => f.priority === priority);
      if (features.length > 0) {
        markdown += `### ${priority} Features\n\n`;
        features.forEach(f => {
          markdown += `#### ${f.name}\n\n${f.description}\n\n`;
          if (f.dependencies && f.dependencies.length > 0) {
            markdown += `**Dependencies:** ${f.dependencies.join(", ")}\n\n`;
          }
        });
      }
    });

    if (prd.assumptions && prd.assumptions.length > 0) {
      markdown += `## Assumptions\n\n${prd.assumptions.map(a => `- ${a}`).join("\n")}\n\n`;
    }

    if (prd.constraints && prd.constraints.length > 0) {
      markdown += `## Constraints\n\n${prd.constraints.map(c => `- ${c}`).join("\n")}\n\n`;
    }

    if (prd.dependencies && prd.dependencies.length > 0) {
      markdown += `## External Dependencies\n\n${prd.dependencies.map(d => `- ${d}`).join("\n")}\n\n`;
    }

    if (prd.timeline && prd.timeline.milestones.length > 0) {
      markdown += `## Timeline\n\n`;
      prd.timeline.milestones.forEach(milestone => {
        markdown += `### ${milestone.name}\n\n`;
        markdown += `**Target Date:** ${milestone.targetDate}\n\n`;
        if (milestone.dependencies && milestone.dependencies.length > 0) {
          markdown += `**Dependencies:** ${milestone.dependencies.join(", ")}\n\n`;
        }
      });
      if (prd.timeline.totalDuration) {
        markdown += `**Total Duration:** ${prd.timeline.totalDuration}\n\n`;
      }
    }

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${prd.title.replace(/\s+/g, "_")}_PRD.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="sticky top-16 bg-bg/95 backdrop-blur-sm py-4 z-20 border-b border-border/50 -mx-6 px-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        <div className="max-w-4xl space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (error || !prd) {
    return (
      <div className="space-y-4">
        <div className="sticky top-16 bg-bg/95 backdrop-blur-sm py-4 z-20 border-b border-border/50 -mx-6 px-6">
          <h1 className="text-3xl font-semibold tracking-tight">PRD</h1>
        </div>
        <div className="max-w-4xl">
          <div className="border border-border rounded-lg p-6 bg-surface">
            <p className="text-error">{error || "PRD not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[2400px] mx-auto">
      {/* Sticky Top Bar */}
      <div className="sticky top-16 bg-bg/95 backdrop-blur-sm py-4 z-20 border-b border-border/50 -mx-6 px-6 max-w-[2400px]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">PRD</h1>
            <p className="text-subtext mt-1">{projectTitle}</p>
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleEdit}>
                  Edit PRD
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? "Regenerating..." : "Regenerate"}
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  Export PRD.md
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* PRD Content */}
      <div className="w-full">
        {isEditing && editedPrd ? (
          <div className="max-w-5xl mx-auto space-y-8 bg-surface p-8 rounded-xl border border-border">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editedPrd.title}
                  onChange={(e) => setEditedPrd({ ...editedPrd, title: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="overview">Overview</Label>
                <Textarea
                  id="overview"
                  value={editedPrd.overview}
                  onChange={(e) => setEditedPrd({ ...editedPrd, overview: e.target.value })}
                  rows={4}
                  className="mt-2"
                />
              </div>

              {editedPrd.problemStatement !== undefined && (
                <div>
                  <Label htmlFor="problemStatement">Problem Statement</Label>
                  <Textarea
                    id="problemStatement"
                    value={editedPrd.problemStatement || ""}
                    onChange={(e) => setEditedPrd({ ...editedPrd, problemStatement: e.target.value })}
                    rows={4}
                    className="mt-2"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="goals">Goals (one per line)</Label>
                <Textarea
                  id="goals"
                  value={editedPrd.goals.join("\n")}
                  onChange={(e) => setEditedPrd({ ...editedPrd, goals: e.target.value.split("\n").filter(Boolean) })}
                  rows={6}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="nonGoals">Non-Goals (one per line)</Label>
                <Textarea
                  id="nonGoals"
                  value={(editedPrd.nonGoals || []).join("\n")}
                  onChange={(e) => setEditedPrd({ ...editedPrd, nonGoals: e.target.value.split("\n").filter(Boolean) })}
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="assumptions">Assumptions (one per line)</Label>
                <Textarea
                  id="assumptions"
                  value={(editedPrd.assumptions || []).join("\n")}
                  onChange={(e) => setEditedPrd({ ...editedPrd, assumptions: e.target.value.split("\n").filter(Boolean) })}
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="constraints">Constraints (one per line)</Label>
                <Textarea
                  id="constraints"
                  value={(editedPrd.constraints || []).join("\n")}
                  onChange={(e) => setEditedPrd({ ...editedPrd, constraints: e.target.value.split("\n").filter(Boolean) })}
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-subtext">
                  Note: This is a simplified editor. For complex edits to features, user stories, personas, and competitive analysis, please use the Regenerate function with updated project data.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <EnhancedPRDViewer prd={prd} />
        )}
      </div>
    </div>
  );
}
