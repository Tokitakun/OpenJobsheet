/**
 * GET  /api/publish/[publicationId]?token=SHARE_TOKEN — Read published document
 * PATCH /api/publish/[publicationId]  (X-Owner-Token) — Update publication
 * DELETE /api/publish/[publicationId] (X-Owner-Token) — Delete publication
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { validateJobsheetDocument } from "@/lib/schema/document";
import type { OpenJobsheetDocument } from "@/lib/schema/document";
import { verifyToken } from "@/lib/publishing/tokens";
import { PUBLISHING_CONFIG } from "@/lib/publishing/config";
import {
  getPublication,
  getLatestSnapshot,
  getAllMediaForPublication,
  updatePublication,
  deletePublicationRecord,
  mediaFilePath,
} from "@/lib/publishing/db-server";

interface RouteContext {
  params: Promise<{ publicationId: string }>;
}

// ─── GET — Public read ────────────────────────────────────────────────────────

export async function GET(request: NextRequest, context: RouteContext) {
  const { publicationId } = await context.params;
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
      { error: "Publikasi ini telah dicabut oleh pemiliknya." },
      { status: 410 }
    );
  }

  if (!verifyToken(token, pub.shareTokenHash)) {
    return NextResponse.json(
      { error: "Token akses tidak valid." },
      { status: 403 }
    );
  }

  const snapshot = getLatestSnapshot(publicationId);
  if (!snapshot) {
    return NextResponse.json(
      { error: "Snapshot publikasi tidak ditemukan." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    document: JSON.parse(snapshot.documentJson),
    version: snapshot.version,
    publishedAt: pub.publishedAt,
    updatedAt: pub.updatedAt,
  });
}

// ─── PATCH — Owner update ─────────────────────────────────────────────────────

interface MediaItem {
  mediaId: string;
  mimeType: string;
  base64: string;
}

interface UpdateRequestBody {
  document: OpenJobsheetDocument;
  mediaItems: MediaItem[];
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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
      { error: "Tidak dapat memperbarui publikasi yang sudah dicabut." },
      { status: 409 }
    );
  }

  const body = (await request.json()) as UpdateRequestBody;

  // Validate document
  const validation = validateJobsheetDocument(body.document);
  if (!validation.valid) {
    return NextResponse.json(
      { error: "Validasi dokumen gagal.", details: validation.errors },
      { status: 400 }
    );
  }

  const docJson = JSON.stringify(body.document);
  if (Buffer.byteLength(docJson, "utf8") > PUBLISHING_CONFIG.MAX_DOCUMENT_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Ukuran dokumen melebihi batas maksimum." },
      { status: 413 }
    );
  }

  // Validate media
  const mediaItems = Array.isArray(body.mediaItems) ? body.mediaItems : [];
  let totalMediaBytes = 0;
  const allowedTypes = PUBLISHING_CONFIG.ALLOWED_MEDIA_TYPES as readonly string[];

  for (const item of mediaItems) {
    if (!allowedTypes.includes(item.mimeType)) {
      return NextResponse.json(
        { error: `Tipe media tidak didukung: ${item.mimeType}.` },
        { status: 400 }
      );
    }
    const buf = Buffer.from(item.base64, "base64");
    if (buf.length > PUBLISHING_CONFIG.MAX_MEDIA_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Media ${item.mediaId} melebihi batas 5 MB.` },
        { status: 413 }
      );
    }
    totalMediaBytes += buf.length;
  }

  if (totalMediaBytes > PUBLISHING_CONFIG.MAX_TOTAL_MEDIA_BYTES) {
    return NextResponse.json(
      { error: "Total ukuran media melebihi batas 20 MB." },
      { status: 413 }
    );
  }

  // Collect old media paths for cleanup
  const oldMediaRows = getAllMediaForPublication(publicationId);
  const oldMediaPaths = oldMediaRows.map((r) => r.filePath);

  // Write new media files
  const newVersion = pub.currentVersion + 1;
  const now = Date.now();
  const snapshotId = randomUUID();

  const mediaFiles: Array<{
    mediaId: string;
    filePath: string;
    mimeType: string;
    sizeBytes: number;
  }> = [];

  for (const item of mediaItems) {
    const ext = item.mimeType.split("/")[1] || "bin";
    const fp = mediaFilePath(publicationId, item.mediaId, ext);
    const buf = Buffer.from(item.base64, "base64");
    fs.writeFileSync(fp, buf);
    mediaFiles.push({
      mediaId: item.mediaId,
      filePath: fp,
      mimeType: item.mimeType,
      sizeBytes: buf.length,
    });
  }

  // Atomically update in SQLite
  updatePublication({
    publicationId,
    snapshotId,
    documentTitle: body.document.title,
    documentJson: docJson,
    mediaIds: mediaItems.map((m) => m.mediaId),
    mediaFiles,
    newVersion,
    now,
    oldMediaPaths,
  });

  // Cleanup old media files (best-effort, after transaction)
  for (const fp of oldMediaPaths) {
    try {
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    } catch {
      // Ignore cleanup failures
    }
  }

  return NextResponse.json({
    version: newVersion,
    updatedAt: now,
  });
}

// ─── DELETE — Owner delete ────────────────────────────────────────────────────

export async function DELETE(request: NextRequest, context: RouteContext) {
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

  // Collect media files for cleanup
  const mediaRows = getAllMediaForPublication(publicationId);
  const mediaPaths = mediaRows.map((r) => r.filePath);

  // Delete from SQLite (CASCADE removes snapshots + media rows)
  deletePublicationRecord(publicationId);

  // Cleanup media files
  for (const fp of mediaPaths) {
    try {
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    } catch {
      // Ignore
    }
  }

  // Cleanup the publication media directory
  const mediaDir = path.join(PUBLISHING_CONFIG.MEDIA_STORAGE_PATH, publicationId);
  try {
    if (fs.existsSync(mediaDir)) fs.rmdirSync(mediaDir);
  } catch {
    // Ignore
  }

  return NextResponse.json({ deleted: true });
}
