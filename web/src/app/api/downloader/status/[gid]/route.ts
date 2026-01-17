import { NextRequest, NextResponse } from "next/server";
import { downloaderService } from "@/lib/downloader";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gid: string }> },
) {
  const { gid } = await params;
  if (!gid)
    return NextResponse.json({ error: "Missing hash/GID" }, { status: 400 });

  const status = await downloaderService.getTorrentStatus(gid);
  if (status.error) {
    return NextResponse.json({ error: status.error }, { status: 404 });
  }

  return NextResponse.json(status);
}
