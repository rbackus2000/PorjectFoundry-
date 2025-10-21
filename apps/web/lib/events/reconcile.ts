import { eventBus } from "./bus";
import { prisma } from "../db/prisma";
import { ArtifactType } from "../zodSchemas";

/**
 * Reconciliation DAG (Dependency-Aware Generation)
 *
 * When a module changes, we need to regenerate artifacts in the correct order:
 * 1. Research (if needed)
 * 2. PRD
 * 3. BackendSpec
 * 4. FrontendSpec
 * 5. UISpec
 * 6. Mermaid diagrams (Flow, ERD)
 * 7. Prompt Packs (Cursor, Claude, Lovable, Bolt)
 * 8. Backlog CSV
 */

type RegenerationContext = {
  projectId: string;
  trigger: "module" | "prd" | "research" | "manual";
  scope: "all" | "partial";
};

/**
 * Main reconciliation orchestrator
 * Call this when modules change, PRD is edited, or user clicks "Regenerate"
 */
export async function reconcile(context: RegenerationContext) {
  console.log(`[Reconcile] Starting for project ${context.projectId}, trigger: ${context.trigger}`);

  const { projectId, scope } = context;

  // Load current project graph
  const projectGraph = await prisma.projectGraph.findUnique({
    where: { projectId },
  });

  if (!projectGraph) {
    console.warn(`[Reconcile] No graph found for project ${projectId}`);
    return;
  }

  const graph = JSON.parse(projectGraph.graphData);

  // Determine what to regenerate based on scope
  const steps: Array<() => Promise<void>> = [];

  if (scope === "all" || context.trigger === "module") {
    // Full regeneration pipeline
    steps.push(
      () => regeneratePRD(projectId, graph),
      () => regenerateBackendSpec(projectId),
      () => regenerateFrontendSpec(projectId),
      () => regenerateUISpec(projectId),
      () => regenerateMermaidFlow(projectId, graph),
      () => regenerateMermaidERD(projectId),
      () => regeneratePromptPacks(projectId),
      () => regenerateBacklog(projectId)
    );
  } else if (context.trigger === "prd") {
    // PRD changed, regenerate downstream
    steps.push(
      () => regenerateBackendSpec(projectId),
      () => regenerateFrontendSpec(projectId),
      () => regenerateUISpec(projectId),
      () => regenerateMermaidERD(projectId),
      () => regeneratePromptPacks(projectId),
      () => regenerateBacklog(projectId)
    );
  }

  // Execute steps in order
  for (const step of steps) {
    try {
      await step();
    } catch (error) {
      console.error("[Reconcile] Step failed:", error);
      // Continue with remaining steps even if one fails
    }
  }

  console.log(`[Reconcile] Completed for project ${projectId}`);
}

/**
 * Individual regeneration functions
 * These call agent stubs and save results to the Artifact table
 */

async function regeneratePRD(projectId: string, graph: any) {
  console.log("[Reconcile] Regenerating PRD...");
  // TODO: Call PM agent with graph
  const prdContent = JSON.stringify({ stub: "PRD from PM agent", graph });
  await saveArtifact(projectId, "PRD", prdContent);
  await eventBus.emit(projectId, {
    type: "ArtifactGenerated",
    artifactType: "PRD",
    artifactId: "prd-latest",
  });
}

async function regenerateBackendSpec(projectId: string) {
  console.log("[Reconcile] Regenerating BackendSpec...");
  // TODO: Call Backend agent with PRD
  const beSpecContent = JSON.stringify({ stub: "BackendSpec from BE agent" });
  await saveArtifact(projectId, "BackendSpec", beSpecContent);
  await eventBus.emit(projectId, {
    type: "ArtifactGenerated",
    artifactType: "BackendSpec",
    artifactId: "backend-latest",
  });
}

async function regenerateFrontendSpec(projectId: string) {
  console.log("[Reconcile] Regenerating FrontendSpec...");
  // TODO: Call Frontend agent with PRD + BackendSpec
  const feSpecContent = JSON.stringify({ stub: "FrontendSpec from FE agent" });
  await saveArtifact(projectId, "FrontendSpec", feSpecContent);
  await eventBus.emit(projectId, {
    type: "ArtifactGenerated",
    artifactType: "FrontendSpec",
    artifactId: "frontend-latest",
  });
}

async function regenerateUISpec(projectId: string) {
  console.log("[Reconcile] Regenerating UISpec...");
  // TODO: Call UI agent with FrontendSpec
  const uiSpecContent = JSON.stringify({ stub: "UISpec from UI agent" });
  await saveArtifact(projectId, "UISpec", uiSpecContent);
  await eventBus.emit(projectId, {
    type: "ArtifactGenerated",
    artifactType: "UISpec",
    artifactId: "ui-latest",
  });
}

async function regenerateMermaidFlow(projectId: string, graph: any) {
  console.log("[Reconcile] Regenerating Mermaid Flow...");
  // TODO: Call makeFlowchart
  const flowContent = "graph TD\n  Start --> End";
  await saveArtifact(projectId, "Mermaid_Flow", flowContent);
}

async function regenerateMermaidERD(projectId: string) {
  console.log("[Reconcile] Regenerating Mermaid ERD...");
  // TODO: Call makeErDiagram with BackendSpec
  const erdContent = "erDiagram\n  USER ||--o{ POST : creates";
  await saveArtifact(projectId, "Mermaid_ERD", erdContent);
}

async function regeneratePromptPacks(projectId: string) {
  console.log("[Reconcile] Regenerating Prompt Packs...");
  // TODO: Call buildCursorPack, buildClaudePack, etc.
  await saveArtifact(projectId, "PromptPack_Cursor", "# Cursor Prompt Pack (stub)");
  await saveArtifact(projectId, "PromptPack_Claude", "# Claude Code Prompt Pack (stub)");
  await saveArtifact(projectId, "PromptPack_Lovable", "# Lovable Prompt Pack (stub)");
  await saveArtifact(projectId, "PromptPack_Bolt", "# Bolt Prompt Pack (stub)");
}

async function regenerateBacklog(projectId: string) {
  console.log("[Reconcile] Regenerating Backlog CSV...");
  // TODO: Extract user stories from PRD and format as CSV
  const csv = "ID,Story,Priority,Status\n1,User can log in,P0,TODO";
  await saveArtifact(projectId, "Backlog_CSV", csv);
}

/**
 * Helper to save artifact to DB
 */
async function saveArtifact(projectId: string, type: ArtifactType, content: string) {
  await prisma.artifact.upsert({
    where: {
      projectId_type: {
        projectId,
        type,
      },
    },
    create: {
      projectId,
      type,
      content,
      version: 1,
    },
    update: {
      content,
      version: { increment: 1 },
    },
  });
}
