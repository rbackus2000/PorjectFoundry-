/**
 * Migration script to add categories to existing project graph modules
 */
import { PrismaClient } from "@prisma/client";
import { mapFeatureToCategory } from "../lib/categoryMapper";

const prisma = new PrismaClient();

async function migrateGraphCategories() {
  console.log("Starting graph category migration...");

  const projects = await prisma.project.findMany({
    include: {
      graph: true,
    },
  });

  for (const project of projects) {
    if (!project.graph) {
      console.log(`Skipping ${project.title} - no graph`);
      continue;
    }

    const graphData = JSON.parse(project.graph.graphData);
    let updated = false;

    // Update nodes to add category if missing
    graphData.nodes = graphData.nodes.map((node: any) => {
      if (!node.category) {
        const category = mapFeatureToCategory(node.label, node.description);
        console.log(`  ${node.label} -> ${category}`);
        updated = true;
        return { ...node, category };
      }
      return node;
    });

    if (updated) {
      await prisma.projectGraph.update({
        where: { id: project.graph.id },
        data: {
          graphData: JSON.stringify(graphData),
        },
      });
      console.log(`✓ Updated ${project.title}`);
    } else {
      console.log(`- ${project.title} already has categories`);
    }
  }

  console.log("Migration complete!");
}

migrateGraphCategories()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
