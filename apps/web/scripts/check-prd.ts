#!/usr/bin/env ts-node

/**
 * PRD Quality Gates Check
 * Usage: npm run prd:check -- --project-id <id>
 *        npm run prd:check -- --all
 */

import { prisma } from "../lib/db/prisma";
import { validatePRDQualityGates, formatQualityGateReport } from "../lib/validation/prdQualityGates";
import { PRD } from "../lib/zodSchemas";

async function checkPRD(projectId: string) {
  console.log(`\n🔍 Checking PRD for project: ${projectId}`);

  const artifact = await prisma.artifact.findFirst({
    where: {
      projectId,
      type: "PRD",
    },
    include: {
      project: {
        select: {
          title: true,
        },
      },
    },
  });

  if (!artifact) {
    console.error(`❌ No PRD found for project ${projectId}`);
    return false;
  }

  const prd: PRD = JSON.parse(artifact.content);
  console.log(`📄 PRD: ${artifact.project.title} (v${prd.version})\n`);

  const report = validatePRDQualityGates(prd);
  console.log(formatQualityGateReport(report));

  return report.passed;
}

async function checkAllPRDs() {
  console.log("\n🔍 Checking all PRDs in database...\n");

  const artifacts = await prisma.artifact.findMany({
    where: {
      type: "PRD",
    },
    include: {
      project: {
        select: {
          title: true,
        },
      },
    },
  });

  console.log(`Found ${artifacts.length} PRD(s)\n`);

  const results = await Promise.all(
    artifacts.map(async (artifact) => {
      const prd: PRD = JSON.parse(artifact.content);
      const report = validatePRDQualityGates(prd);

      return {
        projectId: artifact.projectId,
        title: artifact.project.title,
        version: prd.version,
        passed: report.passed,
        score: report.score,
        errors: report.results.filter((r) => !r.passed && r.severity === "error").length,
        warnings: report.results.filter((r) => !r.passed && r.severity === "warning").length,
      };
    })
  );

  // Print summary table
  console.log("========================================");
  console.log("PRD QUALITY SUMMARY");
  console.log("========================================");
  console.log(
    `${"Project".padEnd(40)} ${"Version".padEnd(10)} ${"Score".padEnd(10)} ${"Errors".padEnd(10)} ${"Status"}`
  );
  console.log("-".repeat(80));

  results.forEach((r) => {
    const status = r.passed ? "✓ PASS" : "✗ FAIL";
    const title = r.title.slice(0, 37) + (r.title.length > 37 ? "..." : "");
    console.log(
      `${title.padEnd(40)} ${r.version.padEnd(10)} ${`${r.score}/100`.padEnd(10)} ${r.errors.toString().padEnd(10)} ${status}`
    );
  });

  console.log("\n");

  const failedCount = results.filter((r) => !r.passed).length;
  const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);

  console.log(`Overall: ${results.length - failedCount}/${results.length} passed (${avgScore}/100 avg score)`);

  if (failedCount > 0) {
    console.log(`\n❌ ${failedCount} PRD(s) failed quality gates`);
    console.log("Run with --project-id <id> to see detailed errors\n");
  } else {
    console.log("\n✅ All PRDs passed quality gates!\n");
  }

  return failedCount === 0;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--all")) {
    const passed = await checkAllPRDs();
    process.exit(passed ? 0 : 1);
  }

  const projectIdIndex = args.indexOf("--project-id");
  if (projectIdIndex !== -1 && args[projectIdIndex + 1]) {
    const projectId = args[projectIdIndex + 1];
    const passed = await checkPRD(projectId);
    process.exit(passed ? 0 : 1);
  }

  console.error("Usage:");
  console.error("  npm run prd:check -- --project-id <project-id>");
  console.error("  npm run prd:check -- --all");
  process.exit(1);
}

main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
