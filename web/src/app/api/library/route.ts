import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { ARIA2_PATH } from "@/lib/downloader";
import { autoConverter } from "@/lib/autoConverter";

export async function GET() {
  // Start background auto-converter if not already running
  autoConverter.start();
  if (!ARIA2_PATH) {
    return NextResponse.json(
      { error: "ARIA2_PATH not configured" },
      { status: 500 },
    );
  }

  try {
    if (!fs.existsSync(ARIA2_PATH)) {
      return NextResponse.json({ folders: [] });
    }

    const items = fs.readdirSync(ARIA2_PATH, { withFileTypes: true });
    const folders = items
      .filter((item) => item.isDirectory())
      .map((item) => item.name);

    return NextResponse.json({ folders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
