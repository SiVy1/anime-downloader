import { Queue } from "bullmq";
import { getRedisConnectionOpts } from "./db";

/**
 * BullMQ Queue Service
 *
 * Provides a singleton access to the PVR task queue.
 */

// Singleton pattern for Next.js HMR
const globalForBull = global as unknown as {
  pvrQueue: Queue | undefined;
  conversionQueue: Queue | undefined;
};

// BullMQ requires maxRetriesPerRequest: null
const connectionOpts = {
  ...getRedisConnectionOpts(),
  maxRetriesPerRequest: null,
};

export const pvrQueue =
  globalForBull.pvrQueue ??
  new Queue("pvr-queue", {
    connection: connectionOpts,
  });

export const conversionQueue =
  globalForBull.conversionQueue ??
  new Queue("conversion-queue", {
    connection: connectionOpts,
  });

if (process.env.NODE_ENV !== "production") {
  globalForBull.pvrQueue = pvrQueue;
  globalForBull.conversionQueue = conversionQueue;
}

/**
 * Add a PVR cycle job to the queue
 */
export async function addPVRJob() {
  const job = await pvrQueue.add(
    "pvr-cycle",
    {},
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );

  console.log(`[Queue] PVR Job added: ${job.id}`);
  return job;
}

/**
 * Add a video conversion job to the queue
 */
export async function addConversionJob(relativePath: string) {
  const job = await conversionQueue.add(
    "convert-video",
    { relativePath },
    {
      jobId: `convert-${relativePath.replace(/\//g, "-")}`, // Deduplicate based on path
      attempts: 2,
      backoff: {
        type: "exponential",
        delay: 10000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );

  console.log(`[Queue] Conversion Job added: ${job.id} (${relativePath})`);
  return job;
}

