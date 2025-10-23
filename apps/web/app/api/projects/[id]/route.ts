import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

/**
 * GET /api/projects/[id]
 * Fetch a single project by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        pitch: true,
        platforms: true,
        status: true,
        wizardData: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Parse wizard data if it exists
    let parsedWizardData = null;
    if (project.wizardData) {
      try {
        parsedWizardData = JSON.parse(project.wizardData);
      } catch (e) {
        console.error("Failed to parse wizardData:", e);
      }
    }

    // Parse platforms
    const targetUsers = parsedWizardData?.targetUsers || [];
    const platforms = project.platforms ? project.platforms.split(",") : [];

    return NextResponse.json({
      id: project.id,
      title: project.title,
      pitch: project.pitch,
      targetUsers,
      platforms,
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}
