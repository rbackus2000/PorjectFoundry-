import dagre from "dagre";
import { Node, Edge } from "reactflow";
import { ModuleNodeData } from "./ModuleNode";
import {
  Lock,
  Server,
  Layout,
  Sparkles,
  BarChart3,
  Brain,
  Link,
  CreditCard,
  Shield,
  Database,
  type LucideIcon
} from "lucide-react";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 100;

export type LayoutDirection = "TB" | "LR" | "radial";

/**
 * Apply hierarchical layout using dagre
 */
export function getLayoutedNodes(
  nodes: Node<ModuleNodeData>[],
  edges: Edge[],
  direction: LayoutDirection = "TB"
): Node<ModuleNodeData>[] {
  if (direction === "radial") {
    return getRadialLayout(nodes, edges);
  }

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    nodesep: 100,
    ranksep: 150,
    marginx: 50,
    marginy: 50,
  });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });
}

/**
 * Apply radial/mind-map layout
 */
function getRadialLayout(
  nodes: Node<ModuleNodeData>[],
  edges: Edge[]
): Node<ModuleNodeData>[] {
  if (nodes.length === 0) return nodes;

  // Build adjacency list
  const adjacencyList = new Map<string, string[]>();
  nodes.forEach((node) => adjacencyList.set(node.id, []));
  edges.forEach((edge) => {
    adjacencyList.get(edge.source)?.push(edge.target);
  });

  // Find root node (most connections or first "in" status node)
  let rootId = nodes[0].id;
  let maxConnections = 0;

  nodes.forEach((node) => {
    const connections = adjacencyList.get(node.id)?.length || 0;
    if (node.data.status === "in" && connections >= maxConnections) {
      rootId = node.id;
      maxConnections = connections;
    }
  });

  const positioned = new Set<string>();
  const layoutedNodes = [...nodes];

  // Position root at center
  const centerX = 600;
  const centerY = 400;
  const rootIndex = layoutedNodes.findIndex((n) => n.id === rootId);
  if (rootIndex !== -1) {
    layoutedNodes[rootIndex].position = { x: centerX, y: centerY };
    positioned.add(rootId);
  }

  // BFS to position children in concentric circles
  const queue: Array<{ id: string; depth: number }> = [{ id: rootId, depth: 0 }];
  const depthRadius = 250; // Distance between levels

  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = adjacencyList.get(current.id)?.filter((id) => !positioned.has(id)) || [];

    if (children.length === 0) continue;

    const radius = (current.depth + 1) * depthRadius;
    const angleStep = (2 * Math.PI) / children.length;

    children.forEach((childId, index) => {
      const angle = index * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const childIndex = layoutedNodes.findIndex((n) => n.id === childId);
      if (childIndex !== -1) {
        layoutedNodes[childIndex].position = { x, y };
        positioned.add(childId);
        queue.push({ id: childId, depth: current.depth + 1 });
      }
    });
  }

  // Position any remaining unconnected nodes in a grid below
  const unpositioned = layoutedNodes.filter((n) => !positioned.has(n.id));
  unpositioned.forEach((node, index) => {
    node.position = {
      x: centerX + (index % 3) * 300 - 300,
      y: centerY + depthRadius * 3 + Math.floor(index / 3) * 150,
    };
  });

  return layoutedNodes;
}

/**
 * Auto-generate edges based on module relationships
 */
export function generateSmartEdges(nodes: Node<ModuleNodeData>[]): Edge[] {
  const edges: Edge[] = [];

  // Define relationship rules
  const relationships: Record<string, string[]> = {
    "Authentication": ["User Profile", "Dashboard", "Settings"],
    "User Profile": ["Dashboard", "Settings"],
    "Dashboard": ["Analytics", "Reports"],
    "Payment": ["Checkout", "Billing"],
    "Admin Panel": ["User Management", "Analytics"],
    "API Integration": ["Backend", "Database"],
    "Notifications": ["Email Service", "Push Notifications"],
  };

  nodes.forEach((sourceNode) => {
    const relatedModules = relationships[sourceNode.data.label] || [];

    relatedModules.forEach((relatedLabel) => {
      const targetNode = nodes.find((n) => n.data.label === relatedLabel);
      if (targetNode && sourceNode.data.status !== "out" && targetNode.data.status !== "out") {
        edges.push({
          id: `e-${sourceNode.id}-${targetNode.id}`,
          source: sourceNode.id,
          target: targetNode.id,
          animated: sourceNode.data.status === "in" && targetNode.data.status === "in",
          style: {
            stroke: sourceNode.data.status === "in" && targetNode.data.status === "in"
              ? "hsl(var(--primary))"
              : "hsl(var(--muted-foreground))",
            strokeWidth: 2,
          },
        });
      }
    });
  });

  return edges;
}

/**
 * Get semantic category color and icon
 */
export function getCategoryStyle(category: string) {
  const categoryStyles: Record<string, { gradient: string; icon: LucideIcon; textColor: string }> = {
    "Authentication": {
      gradient: "from-blue-500 to-blue-700",
      icon: Lock,
      textColor: "text-blue-100",
    },
    "Backend": {
      gradient: "from-blue-600 to-indigo-700",
      icon: Server,
      textColor: "text-blue-100",
    },
    "Frontend": {
      gradient: "from-purple-500 to-purple-700",
      icon: Layout,
      textColor: "text-purple-100",
    },
    "UI/UX": {
      gradient: "from-purple-500 to-pink-600",
      icon: Sparkles,
      textColor: "text-purple-100",
    },
    "Analytics": {
      gradient: "from-yellow-500 to-orange-600",
      icon: BarChart3,
      textColor: "text-yellow-100",
    },
    "AI/ML": {
      gradient: "from-yellow-400 to-amber-600",
      icon: Brain,
      textColor: "text-yellow-100",
    },
    "Integration": {
      gradient: "from-green-500 to-emerald-700",
      icon: Link,
      textColor: "text-green-100",
    },
    "Payment": {
      gradient: "from-green-600 to-teal-700",
      icon: CreditCard,
      textColor: "text-green-100",
    },
    "Security": {
      gradient: "from-red-500 to-red-700",
      icon: Shield,
      textColor: "text-red-100",
    },
    "Data": {
      gradient: "from-cyan-500 to-blue-600",
      icon: Database,
      textColor: "text-cyan-100",
    },
  };

  return categoryStyles[category] || {
    gradient: "from-gray-500 to-gray-700",
    icon: Server,
    textColor: "text-gray-100",
  };
}
