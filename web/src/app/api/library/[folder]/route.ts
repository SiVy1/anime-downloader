import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ARIA2_PATH } from "@/lib/downloader";

export async function GET(
  req: NextRequest,
  { params }: { params: { folder: string } },
) {
  const { folder } = params;
  if (!ARIA2_PATH) {
    return NextResponse.json(
      { error: "ARIA2_PATH not configured" },
      { status: 500 },
    );
  }

  try {
    const fullPath = path.join(ARIA2_PATH, folder);
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const items = fs.readdirSync(fullPath, { withFileTypes: true });
    const files = items
      .filter((item) => item.isFile())
      .filter((item) => {
        const ext = path.extname(item.name).toLowerCase();
        return [".mkv", ".mp4", ".avi", ".mov"].includes(ext);
      })
      .map((item) => item.name);

    return NextResponse.json({ files });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
