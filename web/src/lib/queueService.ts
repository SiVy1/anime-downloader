import { Queue, QueueEvents } from "bullmq";
import env from "./env";

/**
 * BullMQ Queue Service
 *
 * Provides a singleton access to the PVR task queue.
 */

const REDIS_OPTS = {
  url: env.redis.url,
  // BullMQ requires maxRetriesPerRequest to be null for workers
  maxRetriesPerRequest: null,
};

// Singleton pattern for Next.js HMR
const globalForBull = global as unknown as {
  pvrQueue: Queue | undefined;
  pvrEvents: QueueEvents | undefined;
};

export const pvrQueue =
  globalForBull.pvrQueue ??
  new Queue("pvr-queue", {
    connection: {
      host: new URL(env.redis.url).hostname,
      port: parseInt(new URL(env.redis.url).port),
      password: new URL(env.redis.url).password || undefined,
      username: new URL(env.redis.url).username || undefined,
    },
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
