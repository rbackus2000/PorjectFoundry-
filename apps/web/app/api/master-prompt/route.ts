import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { buildMasterPrompt } from "@/lib/promptpack/buildMasterPrompt";
import { PRD, BackendSpec, FrontendSpec, UISpec, ProjectGraph } from "@/lib/zodSchemas";

export async function POST(req: NextRequest) {
  try {
    const { projectId, platforms } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: "At least one platform must be selected" }, { status: 400 });
    }

    // Validate platforms
    const validPlatforms = ["web", "ios", "android"];
    const invalidPlatforms = platforms.filter((p: string) => !validPlatforms.includes(p));
    if (invalidPlatforms.length > 0) {
      return NextResponse.json(
        { error: `Invalid platforms: ${invalidPlatforms.join(", ")}` },
        { status: 400 }
      );
    }

    // Fetch project and graph
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectGraphRecord = await prisma.projectGraph.findFirst({
      where: { projectId },
    });

    if (!projectGraphRecord) {
      return NextResponse.json(
        { error: "Project graph not found. Please create a canvas first." },
        { status: 404 }
      );
    }

    // Fetch all required artifacts
    const artifacts = await prisma.artifact.findMany({
      where: {
        projectId,
        type: {
          in: ["PRD", "BackendSpec", "FrontendSpec", "UISpec", "Mermaid_Flow", "Mermaid_ERD"],
        },
      },
    });

    // Parse artifacts
    const prdArtifact = artifacts.find((a) => a.type === "PRD");
    const backendArtifact = artifacts.find((a) => a.type === "BackendSpec");
    const frontendArtifact = artifacts.find((a) => a.type === "FrontendSpec");
    const uiArtifact = artifacts.find((a) => a.type === "UISpec");
    const flowArtifact = artifacts.find((a) => a.type === "Mermaid_Flow");
    const erdArtifact = artifacts.find((a) => a.type === "Mermaid_ERD");

    if (!prdArtifact || !backendArtifact || !frontendArtifact || !uiArtifact) {
      return NextResponse.json(
        { error: "Missing required artifacts. Please regenerate project artifacts first." },
        { status: 400 }
      );
    }

    // Parse content
    const prd = JSON.parse(prdArtifact.content) as PRD;
    const backendSpec = JSON.parse(backendArtifact.content) as BackendSpec;
    const frontendSpec = JSON.parse(frontendArtifact.content) as FrontendSpec;
    const uiSpec = JSON.parse(uiArtifact.content) as UISpec;
    const mermaidFlow = flowArtifact?.content || "graph TD\nA[Start] --> B[End]";
    const mermaidERD = erdArtifact?.content || "erDiagram\n  USER ||--o{ POST : creates";

    // Get project graph from the fetched record
    const projectGraph = (typeof projectGraphRecord.graphData === 'string'
      ? JSON.parse(projectGraphRecord.graphData)
      : projectGraphRecord.graphData) as ProjectGraph || { nodes: [], edges: [] };

    // Build master prompt
    const masterPrompt = buildMasterPrompt({
      prd,
      backendSpec,
      frontendSpec,
      uiSpec,
      mermaidFlow,
      mermaidERD,
      projectGraph,
      platforms: platforms as ("web" | "ios" | "android")[],
    });

    return NextResponse.json({
      success: true,
      prompt: masterPrompt,
      metadata: {
        projectTitle: prd.title,
        platforms: platforms,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error generating master prompt:", error);
    return NextResponse.json(
      { error: "Failed to generate master prompt" },
      { status: 500 }
    );
  }
}
