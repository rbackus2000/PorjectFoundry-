import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

/**
 * GET /api/dashboard/stats
 * Fetch dashboard statistics
 */
export async function GET() {
  try {
    // Get total projects count
    const projectCount = await prisma.project.count();

    // Get latest project to calculate modules
    const latestProject = await prisma.project.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        graph: true,
      },
    });

    let modulesInScope = 0;
    if (latestProject?.graph) {
      try {
        const graphData = JSON.parse(latestProject.graph.graphData);
        modulesInScope = graphData.nodes?.filter((n: any) => n.status === "in").length || 0;
      } catch (e) {
        console.warn("Failed to parse graph data:", e);
      }
    }

    // Get last generation timestamp from most recent artifact
    let lastGenerate = "Never";
    const latestArtifact = await prisma.artifact.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (latestArtifact) {
      const date = new Date(latestArtifact.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) {
        lastGenerate = "Just now";
      } else if (diffMins < 60) {
        lastGenerate = `${diffMins}m ago`;
      } else if (diffHours < 24) {
        lastGenerate = `${diffHours}h ago`;
      } else {
        lastGenerate = `${diffDays}d ago`;
      }
    }

    return NextResponse.json({
      projectCount,
      modulesInScope,
      lastGenerate,
      errors: 0, // Could be calculated from event logs if needed
    });
  } catch (error) {
    console.error("[Dashboard Stats] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
