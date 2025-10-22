import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { mapFeatureToCategory } from "@/lib/categoryMapper";

export const runtime = "nodejs";

/**
 * GET /api/migrate-categories
 * Migrate existing project graphs to add categories to modules
 */
export async function GET() {
  try {
    console.log("[Migration] Starting graph category migration...");

    const projects = await prisma.project.findMany({
      include: {
        graph: true,
        artifacts: {
          where: {
            type: "PRD",
          },
        },
      },
    });

    const results = [];

    for (const project of projects) {
      if (!project.graph) {
        console.log(`[Migration] Skipping ${project.title} - no graph`);
        results.push({ project: project.title, status: "skipped", reason: "no graph" });
        continue;
      }

      const graphData = JSON.parse(project.graph.graphData);
      let updated = false;
      const updates: string[] = [];

      // Get PRD features to match with nodes
      let prdFeatures: any[] = [];
      if (project.artifacts.length > 0) {
        try {
          const prdData = JSON.parse(project.artifacts[0].content);
          prdFeatures = prdData.features || [];
        } catch (e) {
          console.error(`[Migration] Failed to parse PRD for ${project.title}`);
        }
      }

      // Update nodes to add label and category if missing
      graphData.nodes = graphData.nodes.map((node: any, index: number) => {
        let nodeUpdated = false;
        let newNode = { ...node };

        // Add label if missing (from PRD features by index)
        if (!newNode.label && prdFeatures[index]) {
          newNode.label = prdFeatures[index].name || prdFeatures[index].title;
          nodeUpdated = true;
          console.log(`[Migration]   Added label: ${newNode.label}`);
        }

        // Add or update category
        if (!newNode.category || nodeUpdated) {
          const category = mapFeatureToCategory(newNode.label, newNode.description);
          console.log(`[Migration]   ${newNode.label} -> ${category}`);
          updates.push(`${newNode.label} -> ${category}`);
          newNode.category = category;
          updated = true;
        }

        return newNode;
      });

      if (updated) {
        await prisma.projectGraph.update({
          where: { id: project.graph.id },
          data: {
            graphData: JSON.stringify(graphData),
          },
        });
        console.log(`[Migration] ✓ Updated ${project.title}`);
        results.push({
          project: project.title,
          status: "updated",
          updates,
          modulesUpdated: updates.length,
        });
      } else {
        console.log(`[Migration] - ${project.title} already has categories`);
        results.push({ project: project.title, status: "already_categorized" });
      }
    }

    console.log("[Migration] Migration complete!");

    return NextResponse.json({
      success: true,
      message: "Category migration completed",
      results,
    });
  } catch (error: any) {
    console.error("[Migration] Error:", error);
    return NextResponse.json(
      { error: error.message || "Migration failed" },
      { status: 500 }
    );
  }
}
