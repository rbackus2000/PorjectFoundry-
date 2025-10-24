import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

/**
 * GET /api/debug-canvas?projectId=xxx
 * Debug endpoint to see exactly what's stored in the database
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

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { graph: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (!project.graph) {
      return NextResponse.json({
        message: "No graph data found",
        projectId,
        projectTitle: project.title,
      });
    }

    // Parse the graph data to inspect it
    const graphData = JSON.parse(project.graph.graphData);

    return NextResponse.json({
      projectId,
      projectTitle: project.title,
      graphId: project.graph.id,
      nodeCount: graphData.nodes?.length || 0,
      edgeCount: graphData.edges?.length || 0,
      firstThreeNodes: graphData.nodes?.slice(0, 3) || [],
      rawGraphData: project.graph.graphData, // Raw JSON string
      createdAt: project.graph.createdAt,
      updatedAt: project.graph.updatedAt,
    });
  } catch (error) {
    console.error("[Debug Canvas API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch debug data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
