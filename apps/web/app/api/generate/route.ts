import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { orchestrator } from "@/lib/agents/orchestrator";
import { makeFlowchart } from "@/lib/mermaid/makeFlowchart";
import { makeErDiagram } from "@/lib/mermaid/makeErDiagram";
import { buildCursorPack } from "@/lib/promptpack/buildCursorPack";
import { buildClaudePack } from "@/lib/promptpack/buildClaudePack";
import { buildLovablePack } from "@/lib/promptpack/buildLovablePack";
import { buildBoltPack } from "@/lib/promptpack/buildBoltPack";
import { Idea, ProjectGraph } from "@/lib/zodSchemas";

export const runtime = "nodejs";

/**
 * POST /api/generate
 * Trigger full artifact generation for a project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    // Load project and graph
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { graph: true },
    });

    if (!project || !project.graph) {
      return NextResponse.json({ error: "Project or graph not found" }, { status: 404 });
    }

    const graph: ProjectGraph = JSON.parse(project.graph.graphData);

    // Create a sample idea from project metadata
    const idea: Idea = {
      title: project.title,
      pitch: project.pitch || "A great new product",
      problem: "Users need a better solution",
      solution: "We provide an innovative tool",
      targetUsers: ["Developers", "Product Managers"],
      userPersonas: null,
      platforms: project.platforms?.split(",") || ["Web"],
      coreFeatures: graph.nodes.filter((n) => n.status === "in").map((n) => n.label),
      competitors: null,
      constraints: null,
      inspiration: null,
      successMetrics: null,
    };

    // Generate all artifacts using orchestrator
    console.log("[API] Starting generation...");
    const result = await orchestrator.generate({ idea, graph });

    // Build Mermaid diagrams
    const mermaidFlow = makeFlowchart(graph);
    const mermaidERD = makeErDiagram(result.backendSpec);

    // Build Prompt Packs
    const cursorPack = buildCursorPack({
      prd: result.prd,
      backendSpec: result.backendSpec,
      frontendSpec: result.frontendSpec,
      uiSpec: result.uiSpec,
      mermaidFlow,
      mermaidERD,
    });

    const claudePack = buildClaudePack({
      prd: result.prd,
      backendSpec: result.backendSpec,
      frontendSpec: result.frontendSpec,
      uiSpec: result.uiSpec,
      mermaidFlow,
      mermaidERD,
    });

    const lovablePack = buildLovablePack({
      prd: result.prd,
      frontendSpec: result.frontendSpec,
      uiSpec: result.uiSpec,
    });

    const boltPack = buildBoltPack({
      prd: result.prd,
      backendSpec: result.backendSpec,
      frontendSpec: result.frontendSpec,
    });

    // Save all artifacts to database
    await prisma.artifact.upsert({
      where: { projectId_type: { projectId, type: "PRD" } },
      create: { projectId, type: "PRD", content: JSON.stringify(result.prd), version: 1 },
      update: { content: JSON.stringify(result.prd), version: { increment: 1 } },
    });

    await prisma.artifact.upsert({
      where: { projectId_type: { projectId, type: "BackendSpec" } },
      create: {
        projectId,
        type: "BackendSpec",
        content: JSON.stringify(result.backendSpec),
        version: 1,
      },
      update: { content: JSON.stringify(result.backendSpec), version: { increment: 1 } },
    });

    await prisma.artifact.upsert({
      where: { projectId_type: { projectId, type: "FrontendSpec" } },
      create: {
        projectId,
        type: "FrontendSpec",
        content: JSON.stringify(result.frontendSpec),
        version: 1,
      },
      update: { content: JSON.stringify(result.frontendSpec), version: { increment: 1 } },
    });

    await prisma.artifact.upsert({
      where: { projectId_type: { projectId, type: "UISpec" } },
      create: {
        projectId,
        type: "UISpec",
        content: JSON.stringify(result.uiSpec),
        version: 1,
      },
      update: { content: JSON.stringify(result.uiSpec), version: { increment: 1 } },
    });

    await prisma.artifact.upsert({
      where: { projectId_type: { projectId, type: "Mermaid_Flow" } },
      create: { projectId, type: "Mermaid_Flow", content: mermaidFlow, version: 1 },
      update: { content: mermaidFlow, version: { increment: 1 } },
    });

    await prisma.artifact.upsert({
      where: { projectId_type: { projectId, type: "Mermaid_ERD" } },
      create: { projectId, type: "Mermaid_ERD", content: mermaidERD, version: 1 },
      update: { content: mermaidERD, version: { increment: 1 } },
    });

    await prisma.artifact.upsert({
      where: { projectId_type: { projectId, type: "PromptPack_Cursor" } },
      create: { projectId, type: "PromptPack_Cursor", content: cursorPack, version: 1 },
      update: { content: cursorPack, version: { increment: 1 } },
    });

    await prisma.artifact.upsert({
      where: { projectId_type: { projectId, type: "PromptPack_Claude" } },
      create: { projectId, type: "PromptPack_Claude", content: claudePack, version: 1 },
      update: { content: claudePack, version: { increment: 1 } },
    });

    await prisma.artifact.upsert({
      where: { projectId_type: { projectId, type: "PromptPack_Lovable" } },
      create: { projectId, type: "PromptPack_Lovable", content: lovablePack, version: 1 },
      update: { content: lovablePack, version: { increment: 1 } },
    });

    await prisma.artifact.upsert({
      where: { projectId_type: { projectId, type: "PromptPack_Bolt" } },
      create: { projectId, type: "PromptPack_Bolt", content: boltPack, version: 1 },
      update: { content: boltPack, version: { increment: 1 } },
    });

    console.log("[API] Generation complete!");

    return NextResponse.json({
      success: true,
      message: "All artifacts generated successfully",
      artifactsGenerated: 10,
    });
  } catch (error: any) {
    console.error("[API] Generation error:", error);
    return NextResponse.json(
      { error: error.message || "Generation failed" },
      { status: 500 }
    );
  }
}
