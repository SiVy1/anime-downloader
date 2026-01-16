import { NextRequest, NextResponse } from "next/server";
import { getAria2Status } from "@/lib/downloader";

export async function GET(
  req: NextRequest,
  { params }: { params: { gid: string } },
) {
  const { gid } = params;
  if (!gid) return NextResponse.json({ error: "Brak GID" }, { status: 400 });

  const status = await getAria2Status(gid);
  if (status.error) {
    return NextResponse.json({ error: status.error }, { status: 404 });
  }

  return NextResponse.json(status);
}
