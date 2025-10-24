import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import type { GeneratePRDJobData, GenerateArtifactsJobData, ResearchJobData } from "./queue";
import { generatePRD } from "../agents/pmAgent";
import { generateBackendSpec } from "../agents/beAgent";
import { generateFrontendSpec } from "../agents/feAgent";
import { generateUISpec } from "../agents/uiAgent";
import { conductResearch } from "../agents/researchAgent";
import { prisma } from "../db/prisma";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// PRD Generation Worker
const prdWorker = new Worker<GeneratePRDJobData>(
  "prd-generation",
  async (job: Job<GeneratePRDJobData>) => {
    console.log(`[Worker] Processing PRD job ${job.id} for project ${job.data.projectId}`);

    const { projectId, ideaTitle, ideaPitch, moduleGraph } = job.data;

    // Update job progress
    await job.updateProgress(10);

    // Fetch existing PRD to get current version
    const existingPRD = await prisma.artifact.findFirst({
      where: {
        projectId,
        type: "PRD",
      },
    });

    let currentVersion = "1.0";
    if (existingPRD) {
      try {
        const existingPRDData = JSON.parse(existingPRD.content);
        const versionMatch = existingPRDData.version?.match(/^(\d+)\.(\d+)$/);
        if (versionMatch) {
          const major = parseInt(versionMatch[1]);
          const minor = parseInt(versionMatch[2]);
          currentVersion = `${major}.${minor + 1}`;
        }
      } catch (err) {
        console.warn("[Worker] Could not parse existing PRD version, defaulting to 1.0");
      }
    }

    // Generate PRD using PM agent
    let prd = await generatePRD({
      idea: {
        title: ideaTitle,
        pitch: ideaPitch,
        problem: "User needs solution",
        solution: ideaPitch,
        targetUsers: ["End users"],
        userPersonas: null,
        platforms: ["Web"],
        coreFeatures: [],
        competitors: null,
        constraints: null,
        inspiration: null,
        successMetrics: null,
      },
      graph: moduleGraph || { nodes: [], edges: [] },
      research: undefined,
    });

    // Check completeness and fill missing enterprise sections
    const { checkAndFillPRDCompleteness, formatCompletenessReport } = await import("../validation/prdCompleteness");
    const { prd: completePRD, report } = checkAndFillPRDCompleteness(prd);

    console.log(formatCompletenessReport(report));

    if (report.filledSections.length > 0) {
      console.log(`[Worker] Auto-filled ${report.filledSections.length} missing section(s)`);
    }

    // Use the completed PRD
    prd = completePRD;

    // Override version and lastUpdated with correct values
    prd.version = currentVersion;
    prd.lastUpdated = new Date().toISOString();

    await job.updateProgress(80);

    // Save PRD to database
    await prisma.artifact.upsert({
      where: {
        projectId_type: {
          projectId,
          type: "PRD",
        },
      },
      update: {
        content: JSON.stringify(prd),
        updatedAt: new Date(),
      },
      create: {
        projectId,
        type: "PRD",
        content: JSON.stringify(prd),
      },
    });

    await job.updateProgress(100);

    console.log(`[Worker] PRD job ${job.id} completed`);

    return { success: true, prd };
  },
  { connection }
);

// Artifacts Generation Worker
const artifactsWorker = new Worker<GenerateArtifactsJobData>(
  "artifacts-generation",
  async (job: Job<GenerateArtifactsJobData>) => {
    console.log(`[Worker] Processing artifacts job ${job.id} for project ${job.data.projectId}`);

    const { projectId, prdId } = job.data;

    // Fetch PRD
    const prdArtifact = await prisma.artifact.findFirst({
      where: { projectId, type: "PRD" },
    });

    if (!prdArtifact) {
      throw new Error("PRD not found");
    }

    const prd = JSON.parse(prdArtifact.content);

    await job.updateProgress(10);

    // Generate Backend Spec
    const backendSpec = await generateBackendSpec({ prd, graph: { nodes: [], edges: [] } });
    await prisma.artifact.upsert({
      where: {
        projectId_type: {
          projectId,
          type: "BackendSpec",
        },
      },
      update: {
        content: JSON.stringify(backendSpec),
        updatedAt: new Date(),
      },
      create: {
        projectId,
        type: "BackendSpec",
        content: JSON.stringify(backendSpec),
      },
    });

    await job.updateProgress(33);

    // Generate Frontend Spec
    const frontendSpec = await generateFrontendSpec({ prd, backendSpec, graph: { nodes: [], edges: [] } });
    await prisma.artifact.upsert({
      where: {
        projectId_type: {
          projectId,
          type: "FrontendSpec",
        },
      },
      update: {
        content: JSON.stringify(frontendSpec),
        updatedAt: new Date(),
      },
      create: {
        projectId,
        type: "FrontendSpec",
        content: JSON.stringify(frontendSpec),
      },
    });

    await job.updateProgress(66);

    // Generate UI Spec
    const uiSpec = await generateUISpec({ prd, frontendSpec });
    await prisma.artifact.upsert({
      where: {
        projectId_type: {
          projectId,
          type: "UISpec",
        },
      },
      update: {
        content: JSON.stringify(uiSpec),
        updatedAt: new Date(),
      },
      create: {
        projectId,
        type: "UISpec",
        content: JSON.stringify(uiSpec),
      },
    });

    await job.updateProgress(100);

    console.log(`[Worker] Artifacts job ${job.id} completed`);

    return { success: true, backendSpec, frontendSpec, uiSpec };
  },
  { connection }
);

// Research Worker
const researchWorker = new Worker<ResearchJobData>(
  "research",
  async (job: Job<ResearchJobData>) => {
    console.log(`[Worker] Processing research job ${job.id} for project ${job.data.projectId}`);

    const { projectId, query, useRAG } = job.data;

    await job.updateProgress(10);

    // Conduct research using research agent
    const report = await conductResearch({
      query,
      useRAG,
      orgId: process.env.RAG_DEFAULT_ORG_ID || "00000000-0000-0000-0000-000000000001",
    });

    await job.updateProgress(80);

    // Save research report
    await prisma.artifact.upsert({
      where: {
        projectId_type: {
          projectId,
          type: "ResearchReport",
        },
      },
      update: {
        content: JSON.stringify(report),
        updatedAt: new Date(),
      },
      create: {
        projectId,
        type: "ResearchReport",
        content: JSON.stringify(report),
      },
    });

    await job.updateProgress(100);

    console.log(`[Worker] Research job ${job.id} completed`);

    return { success: true, report };
  },
  { connection }
);

// Error handling
[prdWorker, artifactsWorker, researchWorker].forEach((worker) => {
  worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} completed successfully`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err);
  });

  worker.on("error", (err) => {
    console.error("[Worker] Worker error:", err);
  });
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[Worker] SIGTERM received, closing workers...");
  await Promise.all([
    prdWorker.close(),
    artifactsWorker.close(),
    researchWorker.close(),
  ]);
  await connection.quit();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[Worker] SIGINT received, closing workers...");
  await Promise.all([
    prdWorker.close(),
    artifactsWorker.close(),
    researchWorker.close(),
  ]);
  await connection.quit();
  process.exit(0);
});

console.log("[Worker] BullMQ workers started and listening for jobs...");
