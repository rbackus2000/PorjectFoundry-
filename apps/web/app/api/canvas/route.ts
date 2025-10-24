import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

/**
 * GET /api/canvas?projectId=xxx
 * Fetch canvas graph data for a specific project
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId parameter" },
        { status: 400 }
      );
    }

    // Fetch project with graph
    console.log(`[Canvas API] Loading graph for project ${projectId}`);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { graph: true },
    });

    if (!project) {
      console.log(`[Canvas API] ❌ Project not found: ${projectId}`);
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (!project.graph) {
      // Return empty graph if none exists yet
      console.log(`[Canvas API] ℹ️ No graph found for project, returning empty`);
      return NextResponse.json({
        projectTitle: project.title,
        graph: { nodes: [], edges: [] },
      });
    }

    const graphData = JSON.parse(project.graph.graphData);
    console.log(`[Canvas API] ✅ Loaded graph: ${graphData.nodes?.length || 0} nodes, ${graphData.edges?.length || 0} edges`);

    return NextResponse.json({
      projectTitle: project.title,
      graph: graphData,
    });
  } catch (error) {
    console.error("[Canvas API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch canvas data" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/canvas?projectId=xxx
 * Update canvas graph data for a specific project
 */
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId parameter" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { graph } = body;

    if (!graph) {
      return NextResponse.json(
        { error: "Missing graph data" },
        { status: 400 }
      );
    }

    // Log the save operation
    console.log(`[Canvas API] Saving graph for project ${projectId}`);
    console.log(`[Canvas API] Graph data: ${graph.nodes?.length || 0} nodes, ${graph.edges?.length || 0} edges`);
    console.log(`[Canvas API] First node received:`, JSON.stringify(graph.nodes?.[0], null, 2));

    // Update graph
    const result = await prisma.projectGraph.upsert({
      where: { projectId },
      create: {
        projectId,
        graphData: JSON.stringify(graph),
      },
      update: {
        graphData: JSON.stringify(graph),
      },
    });

    console.log(`[Canvas API] ✅ Graph saved successfully: ${result.id}`);

    return NextResponse.json({
      success: true,
      graphId: result.id,
      nodeCount: graph.nodes?.length || 0,
      edgeCount: graph.edges?.length || 0,
    });
  } catch (error) {
    console.error("[Canvas API] Error saving graph:", error);
    return NextResponse.json(
      { error: "Failed to save canvas data" },
      { status: 500 }
    );
  }
}
