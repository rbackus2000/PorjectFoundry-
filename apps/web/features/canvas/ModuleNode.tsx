"use client";

import { memo, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { cn } from "@/lib/utils";
import { getCategoryStyle } from "./layoutUtils";
import { Plus, Sparkles, Copy, Download, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export type ModuleNodeData = {
  label: string;
  status: "in" | "out" | "maybe";
  category?: string;
  description?: string;
  onStatusChange?: (nodeId: string, status: "in" | "out" | "maybe") => void;
  allModules?: Array<{ label: string; category?: string; description?: string }>;
  projectTitle?: string;
};

const statusStyles = {
  in: {
    ring: "ring-2 ring-green-400/50 shadow-green-500/20",
    badge: "bg-green-500 text-white",
    glow: "shadow-lg shadow-green-500/30",
  },
  out: {
    ring: "ring-1 ring-red-300/30",
    badge: "bg-red-500/20 text-red-300",
    glow: "",
  },
  maybe: {
    ring: "ring-2 ring-yellow-400/40 shadow-yellow-500/20",
    badge: "bg-yellow-500 text-white",
    glow: "shadow-md shadow-yellow-500/20",
  },
};

const statusLabels = {
  in: "✓ Include",
  out: "✗ Exclude",
  maybe: "? Maybe",
};

type AIGeneratedItem = {
  title: string;
  content: string;
  metadata?: string;
};

type AIGeneratedContent = {
  contentType: string;
  items: AIGeneratedItem[];
};

function ModuleNode({ data, id, selected }: NodeProps<ModuleNodeData>) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [aiContent, setAiContent] = useState<AIGeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const handleStatusClick = (newStatus: "in" | "out" | "maybe") => {
    data.onStatusChange?.(id, newStatus);
  };

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai-suggest/module", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleName: data.label,
          category: data.category,
          description: data.description,
          allModules: data.allModules || [],
          projectTitle: data.projectTitle || "Untitled Project",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate content");
      }

      const result = await response.json();
      setAiContent(result);
      setExpandedItems(new Set([0])); // Auto-expand first item
    } catch (error) {
      console.error("AI generation error:", error);
      alert("Failed to generate AI content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    // TODO: Show toast notification
    alert("Copied to clipboard!");
  };

  const downloadAsFile = (title: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const categoryStyle = data.category ? getCategoryStyle(data.category) : null;
  const statusStyle = statusStyles[data.status];

  return (
    <>
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <div
          className={cn(
            "group relative rounded-xl min-w-[220px] transition-all duration-300",
            statusStyle.ring,
            statusStyle.glow,
            selected && "scale-105 ring-4 ring-primary/50"
          )}
        >
          {/* Gradient Background */}
          <div
            className={cn(
              "absolute inset-0 rounded-xl opacity-90",
              categoryStyle ? `bg-gradient-to-br ${categoryStyle.gradient}` : "bg-gradient-to-br from-slate-700 to-slate-800"
            )}
          />

          {/* Content */}
          <div className="relative px-4 py-3 backdrop-blur-sm">
            <Handle
              type="target"
              position={Position.Top}
              className="w-3 h-3 !bg-white/80 border-2 border-gray-300"
            />

            <div className="space-y-2">
              {/* Header with Icon */}
              <div className="flex items-start gap-2">
                {categoryStyle && (
                  <categoryStyle.icon className="w-5 h-5 flex-shrink-0 mt-0.5 text-white/90" strokeWidth={2} />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "font-semibold text-sm leading-tight",
                    categoryStyle?.textColor || "text-white"
                  )}>
                    {data.label}
                  </h3>
                  {data.category && (
                    <p className="text-xs text-white/70 mt-0.5 truncate">{data.category}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              {data.description && (
                <p className="text-xs text-white/80 line-clamp-2 leading-snug">
                  {data.description}
                </p>
              )}

              {/* Status Badge */}
              <div className="flex gap-1.5 pt-1">
                {(["in", "maybe", "out"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusClick(status)}
                    className={cn(
                      "flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                      data.status === status
                        ? statusStyles[status].badge + " shadow-md"
                        : "bg-white/10 text-white/60 hover:bg-white/20 border border-white/10"
                    )}
                  >
                    {statusLabels[status]}
                  </button>
                ))}
              </div>
            </div>

            <Handle
              type="source"
              position={Position.Bottom}
              className="w-3 h-3 !bg-white/80 border-2 border-gray-300"
            />
          </div>

          {/* Glow effect overlay for selected */}
          {selected && (
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          )}

          {/* Expand Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDetailOpen(true);
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-10 opacity-0 group-hover:opacity-100"
            aria-label="View details"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Detail Sheet */}
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <div className="flex items-start gap-3">
              {categoryStyle && (
                <div className={cn("p-3 rounded-lg", `bg-gradient-to-br ${categoryStyle.gradient}`)}>
                  <categoryStyle.icon className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <SheetTitle className="text-2xl mb-1">{data.label}</SheetTitle>
                    {data.category && (
                      <p className="text-sm text-muted-foreground">{data.category} Module</p>
                    )}
                  </div>
                  <Button
                    onClick={handleAIGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        AI Generate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            {/* Overview & Purpose */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                Overview & Purpose
              </h3>
              <div className="bg-surface/50 border border-border rounded-lg p-4">
                <p className="text-sm leading-relaxed text-foreground/90">
                  {data.description || `The ${data.label} module provides essential functionality for ${data.category?.toLowerCase() || 'your application'}. This component handles core operations related to ${data.label.toLowerCase()}, ensuring seamless integration with other system modules.`}
                </p>
              </div>
            </div>

            {/* Key Features */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                Key Features
              </h3>
              <div className="space-y-2">
                {[
                  `Core ${data.label.toLowerCase()} functionality`,
                  `Integration with ${data.category || 'system'} components`,
                  `Scalable and maintainable architecture`,
                  `Security and performance optimizations`,
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <span className="text-foreground/80">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* User Journey / Workflow */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                User Journey / Workflow
              </h3>
              <div className="bg-surface/50 border border-border rounded-lg p-4 space-y-3">
                <div className="space-y-2">
                  {[
                    { step: 1, title: "Initialization", desc: `User accesses ${data.label} interface` },
                    { step: 2, title: "Interaction", desc: `Performs operations within ${data.label}` },
                    { step: 3, title: "Processing", desc: "System processes and validates requests" },
                    { step: 4, title: "Completion", desc: "Results are displayed and actions confirmed" },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Technical Details */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                Technical Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface/50 border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Category</p>
                  <p className="text-sm font-medium">{data.category || "General"}</p>
                </div>
                <div className="bg-surface/50 border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <p className="text-sm font-medium capitalize">{data.status === "in" ? "Included" : data.status === "out" ? "Excluded" : "Maybe"}</p>
                </div>
              </div>
            </div>

            {/* AI Generated Content */}
            {aiContent && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <div className="w-1 h-5 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full" />
                  {aiContent.contentType}
                </h3>
                <div className="space-y-3">
                  {aiContent.items.map((item, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200/50 dark:border-purple-800/50 rounded-lg overflow-hidden"
                    >
                      {/* Item Header */}
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-purple-100/50 dark:hover:bg-purple-900/20 transition-colors"
                        onClick={() => toggleItem(index)}
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{item.title}</h4>
                          {item.metadata && (
                            <p className="text-xs text-muted-foreground mt-1">{item.metadata}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(item.content);
                            }}
                            className="h-8"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadAsFile(item.title, item.content);
                            }}
                            className="h-8"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          {expandedItems.has(index) ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Item Content */}
                      {expandedItems.has(index) && (
                        <div className="px-4 pb-4 border-t border-purple-200/50 dark:border-purple-800/50 pt-4">
                          <pre className="text-sm whitespace-pre-wrap font-sans text-foreground/90 leading-relaxed">
                            {item.content}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dependencies (placeholder) */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                Dependencies
              </h3>
              <div className="bg-surface/50 border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground italic">
                  No dependencies specified. This module can integrate with other {data.category || "system"} modules.
                </p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default memo(ModuleNode);
