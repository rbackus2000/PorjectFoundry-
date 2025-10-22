import { Queue, QueueOptions } from "bullmq";
import IORedis from "ioredis";
import type { ProjectGraph } from "../zodSchemas";

// Redis connection
const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const queueOptions: QueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
};

// Define job data types
export type GeneratePRDJobData = {
  projectId: string;
  ideaTitle: string;
  ideaPitch: string;
  moduleGraph?: ProjectGraph;
};

export type GenerateArtifactsJobData = {
  projectId: string;
  prdId: string;
};

export type ResearchJobData = {
  projectId: string;
  query: string;
  useRAG: boolean;
};

// Create queues
export const prdQueue = new Queue<GeneratePRDJobData>("prd-generation", queueOptions);
export const artifactsQueue = new Queue<GenerateArtifactsJobData>("artifacts-generation", queueOptions);
export const researchQueue = new Queue<ResearchJobData>("research", queueOptions);

// Helper functions to add jobs
export async function enqueuePRDGeneration(data: GeneratePRDJobData) {
  const job = await prdQueue.add("generate-prd", data, {
    removeOnComplete: 100,
    removeOnFail: 100,
  });
  console.log(`[Queue] PRD job ${job.id} enqueued for project ${data.projectId}`);
  return job;
}

export async function enqueueArtifactsGeneration(data: GenerateArtifactsJobData) {
  const job = await artifactsQueue.add("generate-artifacts", data, {
    removeOnComplete: 100,
    removeOnFail: 100,
  });
  console.log(`[Queue] Artifacts job ${job.id} enqueued for project ${data.projectId}`);
  return job;
}

export async function enqueueResearch(data: ResearchJobData) {
  const job = await researchQueue.add("research", data, {
    removeOnComplete: 100,
    removeOnFail: 100,
  });
  console.log(`[Queue] Research job ${job.id} enqueued for project ${data.projectId}`);
  return job;
}

// Graceful shutdown
export async function closeQueues() {
  await Promise.all([
    prdQueue.close(),
    artifactsQueue.close(),
    researchQueue.close(),
  ]);
  await connection.quit();
}
