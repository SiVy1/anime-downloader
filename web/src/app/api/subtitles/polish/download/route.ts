import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import AdmZip from "adm-zip";

/**
 * Proxy for animesub.info subtitle download
 *
 * Performs a POST request to sciagnij.php, then unzips the result
 * to return the pure subtitle file (ASS/SRT) directly.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const sh = searchParams.get("sh");

  if (!id || !sh) {
    return NextResponse.json(
      { error: "Missing id or sh parameters" },
      { status: 400 },
    );
  }

  try {
    const response = await axios.post(
      "http://www.animesub.info/sciagnij.php",
      new URLSearchParams({
        id: id,
        sh: sh,
        single_file: "Pobierz napisy",
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Referer: "http://www.animesub.info/szukaj.php",
        },
        responseType: "arraybuffer",
      },
    );

    const buffer = Buffer.from(response.data);

    // Check if it's a ZIP file (PK magic number)
    if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
      try {
        const zip = new AdmZip(buffer);
        const zipEntries = zip.getEntries();

        // Find the best subtitle file inside
        const subEntry = zipEntries.find(
          (entry) =>
            entry.name.toLowerCase().endsWith(".ass") ||
            entry.name.toLowerCase().endsWith(".srt") ||
            entry.name.toLowerCase().endsWith(".ssa"),
        );

        if (subEntry) {
          const content = zip.readFile(subEntry);
          const ext = subEntry.name.split(".").pop()?.toLowerCase();
          const contentType =
            ext === "ass" || ext === "ssa" ? "text/x-ssa" : "text/plain";

          if (content) {
            // Convert Node.js Buffer to ArrayBuffer for NextResponse compatibility
            const arrayBuffer = content.buffer.slice(
              content.byteOffset,
              content.byteOffset + content.byteLength,
            ) as ArrayBuffer;
            return new NextResponse(arrayBuffer, {
              headers: {
                "Content-Type": contentType,
                "Content-Disposition": `inline; filename="${subEntry.name}"`,
              },
            });
          }
        }
      } catch (zipErr) {
        console.warn(
          "[PolishSubDownload] ZIP processing failed, falling back to raw data",
          zipErr,
        );
      }
    }

    // Fallback if not zip or no sub found inside
    const contentType =
      response.headers["content-type"] || "application/octet-stream";
    return new NextResponse(response.data, {
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (err) {
    console.error("[PolishSubDownload Proxy] Error:", err);
    return NextResponse.json(
      { error: "Failed to download subtitle" },
      { status: 500 },
    );
  }
}
