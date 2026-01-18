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

if (process.env.NODE_ENV !== "production") {
  globalForBull.pvrQueue = pvrQueue;
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
