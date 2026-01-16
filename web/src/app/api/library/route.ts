import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { ARIA2_PATH } from "@/lib/downloader";

export async function GET() {
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
