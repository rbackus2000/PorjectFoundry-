"use client";

import { useCallback, useState, DragEvent, useMemo, useEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";

import ModuleNode, { ModuleNodeData } from "./ModuleNode";
import ModuleLibrary, { ModuleTemplate } from "./ModuleLibrary";
import { Button } from "@/components/ui/button";
import { getLayoutedNodes, generateSmartEdges, LayoutDirection } from "./layoutUtils";

const nodeTypes: NodeTypes = {
  moduleNode: ModuleNode,
};

type CanvasFlowProps = {
  projectId: string;
  projectTitle?: string;
  initialGraph: {
    nodes: Array<{
      id: string;
      label: string;
      status: "in" | "out" | "maybe";
      description?: string;
      x: number;
      y: number;
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
    }>;
  };
};

export default function CanvasFlow({ projectId, projectTitle, initialGraph }: CanvasFlowProps) {
  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>("radial");

  // Convert graph data to ReactFlow format
  const convertedNodes: Node<ModuleNodeData>[] = useMemo(() => {
    return initialGraph.nodes.map((node) => ({
      id: node.id,
      type: "moduleNode",
      position: { x: node.x, y: node.y },
      data: {
        label: node.label,
        status: node.status,
        category: "",
        description: node.description || "",
      },
    }));
  }, [initialGraph.nodes]);

  const convertedEdges: Edge[] = useMemo(() => {
    return initialGraph.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: true,
      style: {
        stroke: "hsl(var(--primary))",
        strokeWidth: 2,
      },
    }));
  }, [initialGraph.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(convertedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(convertedEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(convertedNodes.length + 1);

  // Update nodes when initialGraph changes
  useEffect(() => {
    setNodes(convertedNodes);
    setEdges(convertedEdges);
  }, [convertedNodes, convertedEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleStatusChange = useCallback(
    (nodeId: string, status: "in" | "out" | "maybe") => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                status,
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // Update all nodes to have the status change handler and full project context
  const nodesWithHandlers = useMemo(() => {
    // Extract all modules for context
    const allModules = nodes.map((node) => ({
      label: node.data.label,
      category: node.data.category,
      description: node.data.description,
    }));

    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onStatusChange: handleStatusChange,
        allModules,
        projectTitle: projectTitle || projectId,
      },
    }));
  }, [nodes, handleStatusChange, projectTitle, projectId]);

  const handleAddModule = useCallback(
    (module: ModuleTemplate) => {
      const newNode: Node<ModuleNodeData> = {
        id: `${nodeIdCounter}`,
        type: "moduleNode",
        position: {
          x: Math.random() * 400 + 200,
          y: Math.random() * 300 + 100,
        },
        data: {
          label: module.label,
          status: "maybe",
          category: module.category,
          description: module.description,
          onStatusChange: handleStatusChange,
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setNodeIdCounter((c) => c + 1);
    },
    [nodeIdCounter, setNodes, handleStatusChange]
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const moduleData = event.dataTransfer.getData("application/reactflow");

      if (moduleData) {
        const module: ModuleTemplate = JSON.parse(moduleData);
        const position = {
          x: event.clientX - reactFlowBounds.left - 100,
          y: event.clientY - reactFlowBounds.top - 50,
        };

        const newNode: Node<ModuleNodeData> = {
          id: `${nodeIdCounter}`,
          type: "moduleNode",
          position,
          data: {
            label: module.label,
            status: "maybe",
            category: module.category,
            description: module.description,
            onStatusChange: handleStatusChange,
          },
        };

        setNodes((nds) => [...nds, newNode]);
        setNodeIdCounter((c) => c + 1);
      }
    },
    [nodeIdCounter, setNodes, handleStatusChange]
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);


  const handleAutoLayout = useCallback(() => {
    const layoutedNodes = getLayoutedNodes(nodes, edges, layoutDirection);
    setNodes(layoutedNodes);
  }, [nodes, edges, layoutDirection, setNodes]);

  const handleGenerateEdges = useCallback(() => {
    const smartEdges = generateSmartEdges(nodes);
    setEdges(smartEdges);
  }, [nodes, setEdges]);

  const handleSaveGraph = useCallback(async () => {
    const graphData = {
      nodes: nodes.map(({ id, position, data }) => ({
        id,
        label: data.label,
        status: data.status,
        description: data.description || null,
        x: position.x,
        y: position.y,
      })),
      edges: edges.map(({ id, source, target }) => ({
        id,
        source,
        target,
        label: null,
      })),
    };

    try {
      const response = await fetch(`/api/canvas?projectId=${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graph: graphData }),
      });

      if (!response.ok) {
        throw new Error("Failed to save graph");
      }

      alert("Graph saved successfully!");
    } catch (error) {
      console.error("Error saving graph:", error);
      alert("Failed to save graph. Please try again.");
    }
  }, [nodes, edges, projectId]);

  const handleClearCanvas = useCallback(() => {
    if (confirm("Clear all nodes and edges?")) {
      setNodes([]);
      setEdges([]);
    }
  }, [setNodes, setEdges]);

  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (confirm(`Delete connection from ${edge.source} to ${edge.target}?`)) {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      }
    },
    [setEdges]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] xl:grid-cols-[360px,1fr] 2xl:grid-cols-[400px,1fr] gap-4 h-[calc(100vh-200px)] max-w-[2400px] mx-auto">
      {/* Module Library Sidebar */}
      <div className="overflow-hidden max-h-[800px] lg:max-h-full">
        <ModuleLibrary onAddModule={handleAddModule} />
      </div>

      {/* Canvas Area */}
      <div className="relative border border-border rounded-xl bg-background overflow-hidden shadow-2xl min-h-[600px]">
        <div className="h-full" onDrop={handleDrop} onDragOver={handleDragOver}>
          <ReactFlow
            nodes={nodesWithHandlers}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeClick={handleEdgeClick}
            nodeTypes={nodeTypes}
            fitView
            defaultEdgeOptions={{
              animated: true,
              style: {
                strokeWidth: 2,
                stroke: "hsl(var(--primary) / 0.5)",
              },
            }}
            className="rounded-xl"
          >
            <Controls className="bg-surface/90 backdrop-blur border border-border rounded-lg" />
            <MiniMap
              nodeStrokeWidth={3}
              zoomable
              pannable
              className="!bg-background/90 !border-2 !border-border rounded-lg"
              nodeColor={(node) => {
                const data = node.data as ModuleNodeData;
                if (data.status === "in") return "#10b981";
                if (data.status === "out") return "#ef4444";
                return "#eab308";
              }}
            />
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              className="[&>*]:!stroke-border/30"
            />
          </ReactFlow>
        </div>

        {/* Floating Action Bar */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col gap-3">
          {/* Layout Controls */}
          <div className="flex gap-2 bg-background/95 backdrop-blur-xl px-4 py-3 rounded-xl border border-border shadow-2xl">
            <div className="flex gap-1.5 pr-3 border-r border-border">
              <Button
                onClick={() => setLayoutDirection("radial")}
                size="sm"
                variant={layoutDirection === "radial" ? "default" : "outline"}
                className="h-8"
              >
                🌟 Radial
              </Button>
              <Button
                onClick={() => setLayoutDirection("TB")}
                size="sm"
                variant={layoutDirection === "TB" ? "default" : "outline"}
                className="h-8"
              >
                ⬇️ Vertical
              </Button>
              <Button
                onClick={() => setLayoutDirection("LR")}
                size="sm"
                variant={layoutDirection === "LR" ? "default" : "outline"}
                className="h-8"
              >
                ➡️ Horizontal
              </Button>
            </div>
            <Button onClick={handleAutoLayout} size="sm" className="h-8">
              ✨ Auto-Layout
            </Button>
            <Button onClick={handleGenerateEdges} size="sm" variant="outline" className="h-8">
              🔗 Smart Edges
            </Button>
          </div>

          {/* Main Actions */}
          <div className="flex gap-2 bg-background/95 backdrop-blur-xl px-4 py-3 rounded-xl border border-border shadow-2xl">
            <Button onClick={handleSaveGraph} size="sm" className="h-8">
              💾 Save Graph
            </Button>
            <Button onClick={handleClearCanvas} variant="outline" size="sm" className="h-8">
              🗑️ Clear Canvas
            </Button>

            {/* Status Legend */}
            <div className="flex gap-2 ml-3 pl-3 border-l border-border">
              <div className="flex items-center gap-1.5 px-2">
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-md shadow-green-500/50"></div>
                <span className="text-xs text-muted-foreground">Include</span>
              </div>
              <div className="flex items-center gap-1.5 px-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-md shadow-yellow-500/50"></div>
                <span className="text-xs text-muted-foreground">Maybe</span>
              </div>
              <div className="flex items-center gap-1.5 px-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <span className="text-xs text-muted-foreground">Exclude</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
