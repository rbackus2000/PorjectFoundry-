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

    // Validate PRD schema
    const validatedPrd = PRDSchema.parse(prd);

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
        payload: JSON.stringify({ version: artifact.version + 1 }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "PRD updated successfully",
      version: artifact.version + 1,
    });
  } catch (error: any) {
    console.error("[API] Error updating PRD:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update PRD" },
      { status: 500 }
    );
  }
}
