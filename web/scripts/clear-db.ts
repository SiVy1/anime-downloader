/**
 * Database Cleanup Script
 * Usage: npx ts-node scripts/clear-db.ts [--mongo] [--redis] [--files] [--all]
 *
 * Options:
 *   --mongo  Clear MongoDB database
 *   --redis  Clear Redis cache
 *   --files  Clear anime download folder
 *   --all    Clear everything (default if no options provided)
 *   --yes    Skip confirmation prompts (dangerous!)
 */

import mongoose from "mongoose";
import Redis from "ioredis";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/anime";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const ARIA2_PATH = process.env.ARIA2_PATH || "";

function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function confirm(
  message: string,
  skipConfirmation: boolean,
): Promise<boolean> {
  if (skipConfirmation) {
    console.log(`${message} (auto-confirmed with --yes)`);
    return true;
  }

  const rl = createReadlineInterface();

  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

async function clearMongoDB() {
  console.log("\n🗑️  Connecting to MongoDB...");

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
      await db.collection(collection.name).drop();
      console.log(`   - Dropped ${collection.name} (documents + indexes)`);
    }

    console.log("✅ MongoDB cleared successfully");
  } catch (err) {
    console.error("❌ MongoDB error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

async function clearRedis() {
  console.log("\n🗑️  Connecting to Redis...");

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

async function clearAnimeFolder() {
  console.log("\n🗑️  Checking anime download folder...");

  if (!ARIA2_PATH) {
    console.log("⚠️  ARIA2_PATH not configured, skipping folder cleanup");
    return;
  }

  if (!fs.existsSync(ARIA2_PATH)) {
    console.log(`⚠️  Download folder does not exist: ${ARIA2_PATH}`);
    return;
  }

  try {
    const items = fs.readdirSync(ARIA2_PATH);
    const folders = items.filter((item) => {
      const itemPath = path.join(ARIA2_PATH, item);
      return fs.statSync(itemPath).isDirectory();
    });

    console.log(`📋 Found ${folders.length} anime folders in: ${ARIA2_PATH}`);

    if (folders.length === 0) {
      console.log("   No folders to delete");
      return;
    }

    // List the folders
    for (const folder of folders.slice(0, 10)) {
      console.log(`   - ${folder}`);
    }
    if (folders.length > 10) {
      console.log(`   ... and ${folders.length - 10} more`);
    }

    // Delete each folder
    for (const folder of folders) {
      const folderPath = path.join(ARIA2_PATH, folder);
      fs.rmSync(folderPath, { recursive: true, force: true });
      console.log(`   🗑️  Deleted: ${folder}`);
    }

    console.log("✅ Anime folder cleared successfully");
  } catch (err) {
    console.error("❌ Folder cleanup error:", err);
  }
}

function getTotalSize(dirPath: string): string {
  if (!fs.existsSync(dirPath)) return "0 B";

  let totalSize = 0;

  function walkDir(dir: string) {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
          walkDir(itemPath);
        } else {
          totalSize += stat.size;
        }
      }
    } catch {
      // Ignore permission errors
    }
  }

  walkDir(dirPath);

  // Format size
  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  let size = totalSize;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

async function main() {
  const args = process.argv.slice(2);

  const skipConfirmation = args.includes("--yes") || args.includes("-y");
  const clearAll =
    args.includes("--all") ||
    args.filter((a) => !a.startsWith("-y") && a !== "--yes").length === 0;
  const clearMongoOnly = args.includes("--mongo");
  const clearRedisOnly = args.includes("--redis");
  const clearFilesOnly = args.includes("--files");

  console.log("\n🧹 Database & Files Cleanup Script\n");
  console.log("━".repeat(50));

  // Show what will be cleared
  console.log("\n📝 Operations to perform:");
  if (clearAll || clearMongoOnly)
    console.log("   • MongoDB: Clear all collections");
  if (clearAll || clearRedisOnly)
    console.log("   • Redis: Delete all cached keys");
  if (clearAll || clearFilesOnly) {
    if (ARIA2_PATH) {
      const size = getTotalSize(ARIA2_PATH);
      console.log(`   • Files: Delete all anime folders (${size})`);
      console.log(`     Path: ${ARIA2_PATH}`);
    } else {
      console.log("   • Files: ARIA2_PATH not configured");
    }
  }

  console.log("");

  // MongoDB cleanup
  if (clearAll || clearMongoOnly) {
    const shouldClear = await confirm(
      "⚠️  Do you want to clear MongoDB database?",
      skipConfirmation,
    );
    if (shouldClear) {
      await clearMongoDB();
    } else {
      console.log("   Skipped MongoDB cleanup");
    }
  }

  // Redis cleanup
  if (clearAll || clearRedisOnly) {
    const shouldClear = await confirm(
      "⚠️  Do you want to clear Redis cache?",
      skipConfirmation,
    );
    if (shouldClear) {
      await clearRedis();
    } else {
      console.log("   Skipped Redis cleanup");
    }
  }

  // Files cleanup
  if (clearAll || clearFilesOnly) {
    if (ARIA2_PATH) {
      const shouldClear = await confirm(
        `⚠️  Do you want to delete all anime files in ${ARIA2_PATH}?`,
        skipConfirmation,
      );
      if (shouldClear) {
        await clearAnimeFolder();
      } else {
        console.log("   Skipped files cleanup");
      }
    }
  }

  console.log("\n" + "━".repeat(50));
  console.log("🎉 Cleanup complete!\n");

  process.exit(0);
}

main();
