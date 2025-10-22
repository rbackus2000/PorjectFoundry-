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
import { mapFeaturesWithRelationships } from "@/lib/categoryMapper";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for AI generation

/**
 * POST /api/projects/create
 * Create a new project and trigger full AI generation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle both old simple format (backward compatibility) and new comprehensive format
    let ideaInput: Idea;
    let title: string;
    let pitch: string;
    let platforms: string;

    if (body.title && body.problem && body.solution) {
      // New comprehensive format from wizard
      title = body.title;
      pitch = body.pitch;
      platforms = body.platforms?.join(", ") || "Web";

      ideaInput = {
        title: body.title,
        pitch: body.pitch,
        problem: body.problem,
        solution: body.solution,
        targetUsers: body.targetUsers || [],
        userPersonas: body.userPersonas || null,
        platforms: body.platforms || ["Web"],
        coreFeatures: body.coreFeatures || [],
        competitors: body.competitors || null,
        constraints: body.constraints?.length > 0 ? body.constraints : null,
        inspiration: body.inspiration?.length > 0 ? body.inspiration : null,
        successMetrics: body.successMetrics?.length > 0 ? body.successMetrics : null,
      };
    } else if (body.title && body.idea) {
      // Old simple format (backward compatibility)
      title = body.title;
      pitch = body.idea;
      platforms = "Web";

      ideaInput = {
        title,
        pitch,
        problem: `Problem that ${title} solves`,
        solution: body.idea,
        targetUsers: ["End Users"],
        userPersonas: null,
        platforms: ["Web"],
        coreFeatures: [],
        competitors: null,
        constraints: null,
        inspiration: null,
        successMetrics: null,
      };
    } else {
      return NextResponse.json(
        { error: "Missing required fields (title, problem, solution)" },
        { status: 400 }
      );
    }

    console.log("[API] Creating new project:", title);
    console.log("[API] User personas:", ideaInput.userPersonas?.length || 0);
    console.log("[API] Competitors:", ideaInput.competitors?.length || 0);
    console.log("[API] Success metrics:", ideaInput.successMetrics?.length || 0);

    // Create project with initial metadata
    const project = await prisma.project.create({
      data: {
        title,
        pitch,
        platforms,
        status: "complete", // Mark as complete since we're doing full generation
      },
    });

    const projectId = project.id;

    // Create initial empty graph (will be populated by AI)
    const initialGraph: ProjectGraph = {
      nodes: [],
      edges: [],
    };

    await prisma.projectGraph.create({
      data: {
        projectId,
        graphData: JSON.stringify(initialGraph),
      },
    });

    console.log("[API] Project created, starting AI generation...");

    try {
      // Generate all artifacts using orchestrator
      const result = await orchestrator.generate({
        idea: ideaInput,
        graph: initialGraph,
      });

      console.log("[API] AI generation complete");

      // Extract modules from PRD and update graph with smart categorization
      const featuresWithCategories = mapFeaturesWithRelationships(
        result.prd.features.map((f: any) => ({
          title: f.title,
          description: f.description,
        }))
      );

      const modules = featuresWithCategories.map((feature, index) => ({
        id: `module-${index + 1}`,
        label: feature.title,
        status: "in" as const,
        description: feature.description || "",
        category: feature.category, // Now includes category for proper styling!
        x: (index % 3) * 250 + 100, // Auto-layout in grid (will be re-layouted by user)
        y: Math.floor(index / 3) * 200 + 100,
      }));

      // Auto-generate edges based on feature relationships
      const edges = featuresWithCategories.flatMap((feature, index) =>
        feature.suggestedConnections.map((targetIndex) => ({
          id: `edge-${index}-${targetIndex}`,
          source: `module-${index + 1}`,
          target: `module-${targetIndex + 1}`,
          label: null,
        }))
      );

      const updatedGraph: ProjectGraph = {
        nodes: modules,
        edges: edges,
      };

      // Update graph in database
      await prisma.projectGraph.update({
        where: { projectId },
        data: { graphData: JSON.stringify(updatedGraph) },
      });

      console.log("[API] Graph populated with", modules.length, "modules");

      // Build Mermaid diagrams
      const mermaidFlow = makeFlowchart(updatedGraph);
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
      await Promise.all([
        prisma.artifact.create({
          data: {
            projectId,
            type: "PRD",
            content: JSON.stringify(result.prd),
            version: 1,
          },
        }),
        prisma.artifact.create({
          data: {
            projectId,
            type: "BackendSpec",
            content: JSON.stringify(result.backendSpec),
            version: 1,
          },
        }),
        prisma.artifact.create({
          data: {
            projectId,
            type: "FrontendSpec",
            content: JSON.stringify(result.frontendSpec),
            version: 1,
          },
        }),
        prisma.artifact.create({
          data: {
            projectId,
            type: "UISpec",
            content: JSON.stringify(result.uiSpec),
            version: 1,
          },
        }),
        prisma.artifact.create({
          data: {
            projectId,
            type: "Mermaid_Flow",
            content: mermaidFlow,
            version: 1,
          },
        }),
        prisma.artifact.create({
          data: {
            projectId,
            type: "Mermaid_ERD",
            content: mermaidERD,
            version: 1,
          },
        }),
        prisma.artifact.create({
          data: {
            projectId,
            type: "PromptPack_Cursor",
            content: cursorPack,
            version: 1,
          },
        }),
        prisma.artifact.create({
          data: {
            projectId,
            type: "PromptPack_Claude",
            content: claudePack,
            version: 1,
          },
        }),
        prisma.artifact.create({
          data: {
            projectId,
            type: "PromptPack_Lovable",
            content: lovablePack,
            version: 1,
          },
        }),
        prisma.artifact.create({
          data: {
            projectId,
            type: "PromptPack_Bolt",
            content: boltPack,
            version: 1,
          },
        }),
      ]);

      console.log("[API] All artifacts saved");

      // Log creation event
      await prisma.event.create({
        data: {
          projectId,
          type: "ProjectCreated",
          payload: JSON.stringify({ title, pitch, platforms }),
        },
      });

      return NextResponse.json({
        projectId,
        message: "Project created and artifacts generated successfully",
        modulesGenerated: modules.length,
      });
    } catch (generationError) {
      console.error("[API] Generation failed:", generationError);

      // Delete the project if generation fails
      await prisma.project.delete({ where: { id: projectId } });

      throw new Error(`AI generation failed: ${generationError instanceof Error ? generationError.message : String(generationError)}`);
    }
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create project",
      },
      { status: 500 }
    );
  }
}
