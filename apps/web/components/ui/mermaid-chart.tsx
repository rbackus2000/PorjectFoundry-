"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidChartProps {
  chart: string;
  className?: string;
}

export function MermaidChart({ chart, className = "" }: MermaidChartProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize mermaid with configuration
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
    });
  }, []);

  useEffect(() => {
    const renderChart = async () => {
      if (!elementRef.current || !chart) return;

      try {
        setError(null);

        // Generate a unique ID for this chart
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

        // Clear previous content
        elementRef.current.innerHTML = "";

        // Render the chart
        const { svg } = await mermaid.render(id, chart);
        elementRef.current.innerHTML = svg;
      } catch (err) {
        // Log mermaid errors to console for debugging
        console.error("Mermaid rendering error:", err);
        console.error("Chart content:", chart);
        setError(err instanceof Error ? err.message : "Failed to render chart");
      }
    };

    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className={`bg-surface border border-border rounded-lg p-4 ${className}`}>
        <div className="mb-3 text-sm text-amber-600 flex items-center gap-2">
          <span>⚠️</span>
          <span>Chart rendering failed. Showing raw mermaid code instead.</span>
        </div>
        <pre className="text-sm font-mono whitespace-pre overflow-x-auto text-foreground/80">{chart}</pre>
        <p className="mt-3 text-xs text-muted-foreground">
          Tip: Use the refresh button above to regenerate the chart with proper formatting.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={elementRef}
      className={`mermaid-chart bg-white border border-border rounded-lg p-4 overflow-x-auto ${className}`}
    />
  );
}
