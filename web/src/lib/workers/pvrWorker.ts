import { Worker, Job } from "bullmq";
import { getRedisConnectionOpts } from "../db";
import { runPVRCycle } from "../pvrService";

/**
 * PVR Worker
 *
 * Processes "pvr-cycle" jobs from the "pvr-queue".
 * This worker should be initialized only once.
 */

// BullMQ requires maxRetriesPerRequest: null
const connectionOpts = {
  ...getRedisConnectionOpts(),
  maxRetriesPerRequest: null,
};

let worker: Worker | null = null;

export function initPVRWorker() {
  if (worker) return worker;

  console.log("[PVR Worker] Initializing with connection:", {
    host: connectionOpts.host,
    port: connectionOpts.port,
  });

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
      connection: connectionOpts,
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
