import { Queue } from "bullmq";
import env from "./env";

/**
 * BullMQ Queue Service
 *
 * Provides a singleton access to the PVR task queue.
 */

// Singleton pattern for Next.js HMR
const globalForBull = global as unknown as {
  pvrQueue: Queue | undefined;
};

const connection = {
  url: env.redis.url,
};

// If env.redis.url is just a hostname, we need to handle it.
// BullMQ connection can take host/port or a redis instance.
const redisUrl = env.redis.url;
let connectionOpts: any = {
  maxRetriesPerRequest: null,
};

try {
  const url = new URL(redisUrl);
  connectionOpts = {
    ...connectionOpts,
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password || undefined,
    username: url.username || undefined,
  };
} catch (e) {
  // Fallback if not a full URL
  connectionOpts = {
    ...connectionOpts,
    host: redisUrl.includes(":") ? redisUrl.split(":")[0] : redisUrl,
    port: redisUrl.includes(":") ? parseInt(redisUrl.split(":")[1]) : 6379,
  };
}

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
