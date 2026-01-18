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
 * Parse Redis URL into connection options
 * Used by BullMQ which needs separate connection config
 */
export function getRedisConnectionOpts(): {
  host: string;
  port: number;
  password?: string;
  username?: string;
} {
  const redisUrl = env.redis.url;

  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: url.password || undefined,
      username: url.username || undefined,
    };
  } catch {
    // Fallback if not a full URL (e.g., "localhost:6379" or just "localhost")
    return {
      host: redisUrl.includes(":") ? redisUrl.split(":")[0] : redisUrl,
      port: redisUrl.includes(":") ? parseInt(redisUrl.split(":")[1]) : 6379,
    };
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
