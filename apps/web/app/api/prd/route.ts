import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

/**
 * GET /api/prd?projectId=xxx
 * Fetch PRD for a specific project
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

    // Fetch PRD artifact
    const artifact = await prisma.artifact.findFirst({
      where: {
        projectId,
        type: "PRD",
      },
      include: {
        project: {
          select: {
            title: true,
            pitch: true,
          },
        },
      },
    });

    if (!artifact) {
      return NextResponse.json(
        { error: "PRD not found for this project" },
        { status: 404 }
      );
    }

    const prd = JSON.parse(artifact.content);

    return NextResponse.json({
      prd,
      projectTitle: artifact.project.title,
      projectPitch: artifact.project.pitch,
    });
  } catch (error) {
    console.error("[PRD API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch PRD" },
      { status: 500 }
    );
  }
}
