/**
 * POST /api/publish/[publicationId]/revoke — Revoke publication access
 * Header: X-Owner-Token
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/publishing/tokens";
import {
  getPublication,
  revokePublication,
} from "@/lib/publishing/db-server";

interface RouteContext {
  params: Promise<{ publicationId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { publicationId } = await context.params;
  const ownerToken = request.headers.get("x-owner-token");

  if (!ownerToken) {
    return NextResponse.json(
      { error: "Owner token diperlukan." },
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

  if (!verifyToken(ownerToken, pub.ownerTokenHash)) {
    return NextResponse.json(
      { error: "Owner token tidak valid." },
      { status: 403 }
    );
  }

  if (pub.status === "revoked") {
    return NextResponse.json(
      { error: "Publikasi sudah dicabut sebelumnya." },
      { status: 409 }
    );
  }

  const now = Date.now();
  revokePublication(publicationId, now);

  return NextResponse.json({
    status: "revoked",
    revokedAt: now,
  });
}
