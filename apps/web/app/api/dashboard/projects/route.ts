import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

/**
 * GET /api/dashboard/projects
 * Fetch all projects with their metadata
 */
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        graph: true,
        _count: {
          select: {
            artifacts: true,
          },
        },
      },
    });

    const projectsWithMetadata = projects.map((project) => {
      let modulesInScope = 0;
      if (project.graph) {
        try {
          const graphData = JSON.parse(project.graph.graphData);
          modulesInScope = graphData.nodes?.filter((n: any) => n.status === "in").length || 0;
        } catch (e) {
          console.warn("Failed to parse graph data:", e);
        }
      }

      return {
        id: project.id,
        title: project.title,
        pitch: project.pitch,
        platforms: project.platforms,
        status: project.status,
        createdAt: project.createdAt,
        modulesInScope,
        artifactCount: project._count.artifacts,
      };
    });

    return NextResponse.json(projectsWithMetadata);
  } catch (error) {
    console.error("[Dashboard Projects] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
