import { NextRequest, NextResponse } from "next/server";
import { enqueuePRDGeneration } from "@/lib/jobs/queue";

export const runtime = "nodejs";

/**
 * POST /api/jobs/generate-prd
 * Enqueue a PRD generation job
 *
 * Body: { projectId: string, ideaTitle: string, ideaPitch: string, moduleGraph: object }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, ideaTitle, ideaPitch, moduleGraph } = body;

    if (!projectId || !ideaTitle || !ideaPitch) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, ideaTitle, ideaPitch" },
        { status: 400 }
      );
    }

    const job = await enqueuePRDGeneration({
      projectId,
      ideaTitle,
      ideaPitch,
      moduleGraph: moduleGraph || {},
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: "PRD generation job enqueued",
    });
  } catch (error: any) {
    console.error("[API /jobs/generate-prd] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to enqueue job" },
      { status: 500 }
    );
  }
}
