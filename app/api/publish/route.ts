/**
 * POST /api/publish — Create a new publication
 *
 * Body: { document, mediaItems: { mediaId, mimeType, base64 }[] }
 * Returns: { publicationId, shareToken, ownerToken, shareUrl, version }
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import fs from "fs";
import { validateJobsheetDocument } from "@/lib/schema/document";
import type { OpenJobsheetDocument } from "@/lib/schema/document";
import { generateToken, hashToken } from "@/lib/publishing/tokens";
import { PUBLISHING_CONFIG } from "@/lib/publishing/config";
import { createPublication, mediaFilePath } from "@/lib/publishing/db-server";

interface MediaItem {
  mediaId: string;
  mimeType: string;
  base64: string;
}

interface PublishRequestBody {
  document: OpenJobsheetDocument;
  mediaItems: MediaItem[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PublishRequestBody;

    // Validate document
    if (!body.document) {
      return NextResponse.json(
        { error: "Dokumen tidak ditemukan dalam request." },
        { status: 400 }
      );
    }

    const validation = validateJobsheetDocument(body.document);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Validasi dokumen gagal.",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Check document size
    const docJson = JSON.stringify(body.document);
    if (Buffer.byteLength(docJson, "utf8") > PUBLISHING_CONFIG.MAX_DOCUMENT_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Ukuran dokumen melebihi batas maksimum (2 MB)." },
        { status: 413 }
      );
    }

    // Validate media items
    const mediaItems = Array.isArray(body.mediaItems) ? body.mediaItems : [];
    let totalMediaBytes = 0;
    const allowedTypes = PUBLISHING_CONFIG.ALLOWED_MEDIA_TYPES as readonly string[];

    for (const item of mediaItems) {
      if (!item.mediaId || !item.mimeType || !item.base64) {
        return NextResponse.json(
          { error: `Media item tidak lengkap: ${item.mediaId || "unknown"}.` },
          { status: 400 }
        );
      }

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

    // Generate IDs and tokens
    const publicationId = randomUUID();
    const snapshotId = randomUUID();
    const shareToken = generateToken();
    const ownerToken = generateToken();
    const now = Date.now();

    // Write media files to disk
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

    // Persist to SQLite
    createPublication({
      publicationId,
      shareTokenHash: hashToken(shareToken),
      ownerTokenHash: hashToken(ownerToken),
      documentTitle: body.document.title,
      snapshotId,
      documentJson: docJson,
      mediaIds: mediaItems.map((m) => m.mediaId),
      mediaFiles,
      now,
    });

    // Build share URL
    const origin = request.nextUrl.origin;
    const shareUrl = `${origin}/pub/${publicationId}?token=${shareToken}`;

    return NextResponse.json({
      publicationId,
      shareToken,
      ownerToken,
      shareUrl,
      version: 1,
    });
  } catch (err) {
    console.error("Publish error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat membuat publikasi." },
      { status: 500 }
    );
  }
}
