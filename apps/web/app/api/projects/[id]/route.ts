import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { supabase } from "@/lib/rag/supabase";

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

/**
 * DELETE /api/projects/[id]
 * Delete a project and all associated data (including RAG data from Supabase)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    console.log(`[Delete Project] Starting deletion for project: ${projectId}`);

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, title: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Delete RAG data from Supabase (documents and chunks)
    // The project_id is stored in the metadata field as a JSON object
    console.log(`[Delete Project] Deleting RAG data from Supabase...`);

    const { error: supabaseError } = await supabase
      .from("documents")
      .delete()
      .eq("org_id", process.env.RAG_DEFAULT_ORG_ID || "00000000-0000-0000-0000-000000000001")
      .contains("metadata", { project_id: projectId });

    if (supabaseError) {
      console.error("[Delete Project] Error deleting from Supabase:", supabaseError);
      // Continue with deletion even if Supabase fails - log but don't block
    } else {
      console.log(`[Delete Project] ✓ Deleted RAG data from Supabase`);
    }

    // Delete from Prisma database
    // This will cascade delete ProjectGraph and Artifacts due to foreign key constraints
    console.log(`[Delete Project] Deleting project from database...`);

    await prisma.project.delete({
      where: { id: projectId },
    });

    console.log(`[Delete Project] ✓ Successfully deleted project: ${project.title}`);

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
      projectId: projectId,
    });
  } catch (error) {
    console.error("[Delete Project] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
