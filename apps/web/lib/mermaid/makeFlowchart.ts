import { ProjectGraph, ModuleNode, ModuleEdge } from "../zodSchemas";

/**
 * Generate Mermaid flowchart from project graph
 * Shows module dependencies and status
 */

export function makeFlowchart(graph: ProjectGraph): string {
  const lines: string[] = ["flowchart TD"];

  // Add nodes
  for (const node of graph.nodes) {
    const nodeId = sanitizeId(node.id);
    const label = node.label;
    const style = getNodeStyle(node);

    lines.push(`  ${nodeId}["${label}"]`);

    // Apply styling based on status
    if (node.status === "in") {
      lines.push(`  style ${nodeId} fill:#d4edda,stroke:#28a745,stroke-width:2px`);
    } else if (node.status === "out") {
      lines.push(`  style ${nodeId} fill:#f8d7da,stroke:#dc3545,stroke-width:2px`);
    } else if (node.status === "maybe") {
      lines.push(`  style ${nodeId} fill:#fff3cd,stroke:#ffc107,stroke-width:2px`);
    }
  }

  // Add edges
  for (const edge of graph.edges) {
    const sourceId = sanitizeId(edge.source);
    const targetId = sanitizeId(edge.target);
    const label = edge.label ? `|${edge.label}|` : "";
    lines.push(`  ${sourceId} --> ${label} ${targetId}`);
  }

  return lines.join("\n");
}

/**
 * Sanitize node IDs for Mermaid (remove special chars)
 */
function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, "_");
}

/**
 * Get node style based on type and status
 */
function getNodeStyle(node: ModuleNode): string {
  // Could expand this for different node types
  return "default";
}

/**
 * Generate a simple user flow diagram
 */
export function makeUserFlow(flows: Array<{ from: string; to: string; action: string }>): string {
  const lines: string[] = ["flowchart LR"];

  flows.forEach((flow, idx) => {
    const fromId = sanitizeId(flow.from);
    const toId = sanitizeId(flow.to);
    lines.push(`  ${fromId}["${flow.from}"] -->|"${flow.action}"| ${toId}["${flow.to}"]`);
  });

  return lines.join("\n");
}
