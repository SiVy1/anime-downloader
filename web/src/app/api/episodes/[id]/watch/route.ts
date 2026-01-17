import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Episode } from "@/models/Anime";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await connectDB();
    const episode = await Episode.findById(id);

    if (!episode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    const body = await req.json();
    const { watched } = body;

    if (typeof watched === "boolean") {
      episode.watched = watched;
      await episode.save();
    } else {
      // Toggle
      episode.watched = !episode.watched;
      await episode.save();
    }

    return NextResponse.json({ success: true, watched: episode.watched });
  } catch (error: any) {
    console.error("[Watch Toggle API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
