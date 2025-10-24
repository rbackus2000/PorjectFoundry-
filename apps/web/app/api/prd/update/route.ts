import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { PRDSchema } from "@/lib/zodSchemas";

export const runtime = "nodejs";

/**
 * POST /api/prd/update
 * Update an existing PRD
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, prd } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    if (!prd) {
      return NextResponse.json({ error: "Missing PRD data" }, { status: 400 });
    }

    // Update the PRD artifact in the database
    const artifact = await prisma.artifact.findFirst({
      where: {
        projectId,
        type: "PRD",
      },
    });

    if (!artifact) {
      return NextResponse.json({ error: "PRD not found" }, { status: 404 });
    }

    // Parse existing PRD to get current version
    let newVersion = "1.0";
    try {
      const existingPRD = JSON.parse(artifact.content);
      const versionMatch = existingPRD.version?.match(/^(\d+)\.(\d+)$/);
      if (versionMatch) {
        const major = parseInt(versionMatch[1]);
        const minor = parseInt(versionMatch[2]);
        newVersion = `${major}.${minor + 1}`;
      }
    } catch (err) {
      console.warn("[API] Could not parse existing PRD version, defaulting to 1.0");
    }

    // Update version and lastUpdated in the PRD content
    prd.version = newVersion;
    prd.lastUpdated = new Date().toISOString();

    // Validate PRD schema
    const validatedPrd = PRDSchema.parse(prd);

    await prisma.artifact.update({
      where: { id: artifact.id },
      data: {
        content: JSON.stringify(validatedPrd),
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    // Log the update event
    await prisma.event.create({
      data: {
        projectId,
        type: "PRDUpdated",
        payload: JSON.stringify({ version: newVersion }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "PRD updated successfully",
      version: newVersion,
    });
  } catch (error: any) {
    console.error("[API] Error updating PRD:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update PRD" },
      { status: 500 }
    );
  }
}
