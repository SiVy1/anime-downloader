import { Worker, Job } from "bullmq";
import env from "../env";
import { runPVRCycle } from "../pvrService";

/**
 * PVR Worker
 *
 * Processes "pvr-cycle" jobs from the "pvr-queue".
 * This worker should be initialized only once.
 */

const REDIS_CONNECTION = {
  host: new URL(env.redis.url).hostname,
  port: parseInt(new URL(env.redis.url).port),
  password: new URL(env.redis.url).password || undefined,
  username: new URL(env.redis.url).username || undefined,
  maxRetriesPerRequest: null,
};

let worker: Worker | null = null;

export function initPVRWorker() {
  if (worker) return worker;

  console.log("[PVR Worker] Initializing...");

  worker = new Worker(
    "pvr-queue",
    async (job: Job) => {
      if (job.name === "pvr-cycle") {
        console.log(`[PVR Worker] Starting PVR cycle (Job: ${job.id})...`);
        const results = await runPVRCycle();
        console.log(
          `[PVR Worker] Cycle complete. Checked ${results.length} titles.`,
        );
        return results;
      }
    },
    {
      connection: REDIS_CONNECTION,
      concurrency: 1, // Only one PVR cycle at a time
    },
  );

  worker.on("completed", (job) => {
    console.log(`[PVR Worker] Job ${job.id} completed successfully.`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[PVR Worker] Job ${job?.id} failed:`, err);
  });

  return worker;
}

// Auto-init for common use cases, but API routes may need to call this explicitly
if (typeof process !== "undefined" && process.env.NODE_ENV !== "test") {
  // In Next.js, we might want to trigger this via a 'health check' or a specific startup routine
  // For now, we'll let it be imported and called.
}
