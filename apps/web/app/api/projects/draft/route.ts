import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

/**
 * POST /api/projects/draft
 * Save or update a draft project with wizard data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, wizardData } = body;

    if (!wizardData || !wizardData.title) {
      return NextResponse.json(
        { error: "Missing wizard data or title" },
        { status: 400 }
      );
    }

    console.log(`[API] Saving draft project: ${wizardData.title}`);

    let project;

    if (projectId) {
      // Update existing draft
      project = await prisma.project.update({
        where: { id: projectId },
        data: {
          title: wizardData.title,
          pitch: wizardData.pitch || null,
          platforms: wizardData.platforms?.join(",") || null,
          status: "draft",
          wizardData: JSON.stringify(wizardData),
          updatedAt: new Date(),
        },
      });

      console.log(`[API] Updated draft project: ${project.id}`);
    } else {
      // Create new draft
      project = await prisma.project.create({
        data: {
          title: wizardData.title,
          pitch: wizardData.pitch || null,
          platforms: wizardData.platforms?.join(",") || null,
          status: "draft",
          wizardData: JSON.stringify(wizardData),
        },
      });

      // Create empty graph
      await prisma.projectGraph.create({
        data: {
          projectId: project.id,
          graphData: JSON.stringify({ nodes: [], edges: [] }),
        },
      });

      console.log(`[API] Created new draft project: ${project.id}`);
    }

    // Log event
    await prisma.event.create({
      data: {
        projectId: project.id,
        type: "DraftSaved",
        payload: JSON.stringify({
          title: wizardData.title,
          step: wizardData.currentStep || 1,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      projectId: project.id,
      message: "Draft saved successfully",
    });
  } catch (error: any) {
    console.error("[API] Error saving draft:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save draft" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/projects/draft?projectId=xxx
 * Load a draft project's wizard data
 */
export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        pitch: true,
        platforms: true,
        status: true,
        wizardData: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    let wizardData = null;
    if (project.wizardData) {
      try {
        wizardData = JSON.parse(project.wizardData);
      } catch (e) {
        console.error("[API] Failed to parse wizardData:", e);
      }
    }

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        pitch: project.pitch,
        platforms: project.platforms,
        status: project.status,
      },
      wizardData,
    });
  } catch (error: any) {
    console.error("[API] Error loading draft:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load draft" },
      { status: 500 }
    );
  }
}
