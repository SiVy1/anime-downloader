import { Worker, Job } from "bullmq";
import { getRedisConnectionOpts } from "../db";
import { convertMkvToMp4 } from "../conversionService";

/**
 * Conversion Worker
 * 
 * Processes "convert-video" jobs from the "conversion-queue".
 * concurrency is set to 1 to prevent CPU starvation and race conditions.
 */

const connectionOpts = {
  ...getRedisConnectionOpts(),
  maxRetriesPerRequest: null,
};

let worker: Worker | null = null;

export function initConversionWorker() {
  if (worker) return worker;

  console.log("[Conversion Worker] Initializing...");

  worker = new Worker(
    "conversion-queue",
    async (job: Job) => {
      if (job.name === "convert-video") {
        const { relativePath } = job.data;
        console.log(`[Conversion Worker] Starting conversion: ${relativePath} (Job: ${job.id})`);
        
        try {
          const result = await convertMkvToMp4(relativePath, (progress) => {
            // Update BullMQ progress
            job.updateProgress(Math.round(progress.percent));
          });

          if (!result.success) {
            throw new Error(result.error || "Unknown conversion error");
          }

          console.log(`[Conversion Worker] Successfully converted: ${relativePath}`);
          return result;
        } catch (error: any) {
          console.error(`[Conversion Worker] Job ${job.id} error:`, error.message);
          throw error;
        }
      }
    },
    {
      connection: connectionOpts,
      concurrency: 1, // Strictly one at a time
    }
  );

  worker.on("completed", (job) => {
    console.log(`[Conversion Worker] Job ${job.id} finished.`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Conversion Worker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
