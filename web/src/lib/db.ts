import mongoose from "mongoose";
import Redis from "ioredis";
import env from "./env";

/**
 * MongoDB Connection
 */
let cachedMongo: typeof mongoose | null = (global as any).mongoose || null;

export async function connectDB() {
  if (cachedMongo) return cachedMongo;

  try {
    const opts = {
      bufferCommands: false,
    };
    cachedMongo = await mongoose.connect(env.mongodb.uri, opts);
    (global as any).mongoose = cachedMongo;
    console.log(`[DB] MongoDB Connected Successfully`);
    return cachedMongo;
  } catch (error) {
    console.error("[DB] MongoDB Connection Error:", error);
    throw error;
  }
}

/**
 * Redis Connection (Singleton)
 */
let redis: Redis | null = null;

export function getRedis() {
  if (!redis) {
    redis = new Redis(env.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    redis.on("error", (err) => console.error("[REDIS] Connection Error:", err));
    redis.on("connect", () => console.log("[REDIS] Connecting to server..."));
    redis.on("ready", () =>
      console.log("[REDIS] Connection Established & Ready"),
    );
  }
  return redis;
}
