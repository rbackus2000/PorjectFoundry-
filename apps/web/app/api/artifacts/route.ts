import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

/**
 * GET /api/artifacts?projectId=xxx
 * Fetch all artifacts for a specific project
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

    // Fetch project with artifacts
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        artifacts: {
          orderBy: { createdAt: "desc" }
        }
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Parse artifact content and organize by type
    const artifacts = project.artifacts.map(artifact => ({
      id: artifact.id,
      type: artifact.type,
      content: artifact.content,
      version: artifact.version,
      createdAt: artifact.createdAt,
      updatedAt: artifact.updatedAt,
    }));

    return NextResponse.json({
      projectTitle: project.title,
      artifacts,
    });
  } catch (error) {
    console.error("[Artifacts API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch artifacts" },
      { status: 500 }
    );
  }
}
