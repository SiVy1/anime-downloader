import { NextRequest, NextResponse } from "next/server";
import { linkFolderToAnime } from "@/lib/libraryService";

/**
 * POST /api/anime/[id]/link
 *
 * Link a local folder to an anime and sync episode files.
 * Thin controller - delegates to LibraryService.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: malIdStr } = await params;
  const malId = parseInt(malIdStr, 10);

  if (isNaN(malId)) {
    return NextResponse.json({ error: "Invalid anime ID" }, { status: 400 });
  }

  let folderName: string;
  try {
    const body = await req.json();
    folderName = body.folderName;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!folderName) {
    return NextResponse.json({ error: "Missing folderName" }, { status: 400 });
  }

  try {
    // Service handles all business logic
    const result = await linkFolderToAnime(malId, folderName);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes("not found") ? 404 : 400 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(`[Link API] Error linking folder ${folderName}:`, error);
    return NextResponse.json(
      { error: "Failed to link folder" },
      { status: 500 },
    );
  }
}
