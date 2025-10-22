import { Queue, QueueOptions } from "bullmq";
import { getRedis } from "../redis";
import type { ProjectGraph } from "../zodSchemas";

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

// Lazy-initialized queues
const key = "__queues__" as const;

interface QueueCache {
  prdQueue: Queue<GeneratePRDJobData>;
  artifactsQueue: Queue<GenerateArtifactsJobData>;
  researchQueue: Queue<ResearchJobData>;
}

function getQueues(): QueueCache {
  // @ts-ignore
  if (!globalThis[key]) {
    const connection = getRedis();

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

    // @ts-ignore
    globalThis[key] = {
      prdQueue: new Queue<GeneratePRDJobData>("prd-generation", queueOptions),
      artifactsQueue: new Queue<GenerateArtifactsJobData>("artifacts-generation", queueOptions),
      researchQueue: new Queue<ResearchJobData>("research", queueOptions),
    };
  }
  // @ts-ignore
  return globalThis[key] as QueueCache;
}

// Export queues with lazy getters
export const prdQueue = new Proxy({} as Queue<GeneratePRDJobData>, {
  get: (target, prop) => {
    const queues = getQueues();
    const value = (queues.prdQueue as any)[prop];
    return typeof value === 'function' ? value.bind(queues.prdQueue) : value;
  }
});

export const artifactsQueue = new Proxy({} as Queue<GenerateArtifactsJobData>, {
  get: (target, prop) => {
    const queues = getQueues();
    const value = (queues.artifactsQueue as any)[prop];
    return typeof value === 'function' ? value.bind(queues.artifactsQueue) : value;
  }
});

export const researchQueue = new Proxy({} as Queue<ResearchJobData>, {
  get: (target, prop) => {
    const queues = getQueues();
    const value = (queues.researchQueue as any)[prop];
    return typeof value === 'function' ? value.bind(queues.researchQueue) : value;
  }
});

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
  // @ts-ignore
  if (globalThis[key]) {
    const queues = getQueues();
    await Promise.all([
      queues.prdQueue.close(),
      queues.artifactsQueue.close(),
      queues.researchQueue.close(),
    ]);
    const connection = getRedis();
    await connection.quit();
  }
}
