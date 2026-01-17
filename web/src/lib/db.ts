import mongoose from "mongoose";
import Redis from "ioredis";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/anime_downloader";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

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
    cachedMongo = await mongoose.connect(MONGODB_URI, opts);
    (global as any).mongoose = cachedMongo;
    console.log("[DB] MongoDB Connected");
    return cachedMongo;
  } catch (error) {
    console.error("[DB] MongoDB connection error:", error);
    throw error;
  }
}

/**
 * Redis Connection (Singleton)
 */
let redis: Redis | null = null;

export function getRedis() {
  if (!redis) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    redis.on("error", (err) => console.error("[REDIS] Error:", err));
    redis.on("connect", () => console.log("[REDIS] Connected"));
  }
  return redis;
}
