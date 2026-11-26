/**
 * GET /api/publish/[publicationId]/media/[mediaId]?token=SHARE_TOKEN
 * Serve published media file after verifying share token + publication active.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { verifyToken } from "@/lib/publishing/tokens";
import { getPublication, getMediaRow } from "@/lib/publishing/db-server";

interface RouteContext {
  params: Promise<{ publicationId: string; mediaId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { publicationId, mediaId } = await context.params;
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Share token diperlukan." },
      { status: 401 }
    );
  }

  const pub = getPublication(publicationId);
  if (!pub) {
    return NextResponse.json(
      { error: "Publikasi tidak ditemukan." },
      { status: 404 }
    );
  }

  if (pub.status === "revoked") {
    return NextResponse.json(
      { error: "Publikasi telah dicabut." },
      { status: 410 }
    );
  }

  if (!verifyToken(token, pub.shareTokenHash)) {
    return NextResponse.json(
      { error: "Token akses tidak valid." },
      { status: 403 }
    );
  }

  const media = getMediaRow(publicationId, mediaId);
  if (!media) {
    return NextResponse.json(
      { error: "Media tidak ditemukan." },
      { status: 404 }
    );
  }

  if (!fs.existsSync(media.filePath)) {
    return NextResponse.json(
      { error: "File media tidak tersedia." },
      { status: 404 }
    );
  }

  const buffer = fs.readFileSync(media.filePath);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": media.mimeType,
      "Content-Length": String(buffer.length),
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
