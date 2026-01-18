import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSetting, setSetting } from "@/models/Settings";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    await connectDB();

    if (key) {
      const value = await getSetting(key, null);
      return NextResponse.json({ key, value });
    }

    // Default: return common settings
    const discord_webhook_url = await getSetting("discord_webhook_url", "");
    
    return NextResponse.json({
      discord_webhook_url,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    await connectDB();
    await setSetting(key, value);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
