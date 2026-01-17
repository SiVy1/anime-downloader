/**
 * Database Cleanup Script
 * Usage: npx ts-node scripts/clear-db.ts [--mongo] [--redis] [--all]
 */

import mongoose from "mongoose";
import Redis from "ioredis";
import path from "path";

// Load environment variables

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/anime-downloader";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

async function clearMongoDB() {
  console.log("🗑️  Connecting to MongoDB...");

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }

    const collections = await db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections`);

    for (const collection of collections) {
      const result = await db.collection(collection.name).deleteMany({});
      console.log(
        `   - Cleared ${collection.name}: ${result.deletedCount} documents`,
      );
    }

    console.log("✅ MongoDB cleared successfully");
  } catch (err) {
    console.error("❌ MongoDB error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

async function clearRedis() {
  console.log("🗑️  Connecting to Redis...");

  const redis = new Redis(REDIS_URL);

  try {
    await redis.ping();
    console.log("✅ Connected to Redis");

    const keys = await redis.keys("*");
    console.log(`📋 Found ${keys.length} keys`);

    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`   - Deleted ${keys.length} keys`);
    }

    console.log("✅ Redis cleared successfully");
  } catch (err) {
    console.error("❌ Redis error:", err);
  } finally {
    redis.disconnect();
  }
}

async function main() {
  const args = process.argv.slice(2);

  const clearAll = args.includes("--all") || args.length === 0;
  const clearMongoOnly = args.includes("--mongo");
  const clearRedisOnly = args.includes("--redis");

  console.log("\n🧹 Database Cleanup Script\n");
  console.log("━".repeat(40));

  if (clearAll || clearMongoOnly) {
    await clearMongoDB();
    console.log("");
  }

  if (clearAll || clearRedisOnly) {
    await clearRedis();
    console.log("");
  }

  console.log("━".repeat(40));
  console.log("🎉 Cleanup complete!\n");

  process.exit(0);
}

main();
