/**
 * Client-side Publishing Service for OpenJobsheet
 * Orchestrates communication between local IndexedDB data and the Publishing API.
 */

import type { OpenJobsheetDocument } from "@/lib/schema/document";
import { validateJobsheetDocument } from "@/lib/schema/document";
import {
  getJobsheetById,
  getPublicationsByDocumentId,
  saveLocalPublication,
  updateLocalPublicationStatus,
  deleteLocalPublication,
  getMediaAsset,
} from "@/lib/storage/jobsheet-repository";

export interface PublishResult {
  publicationId: string;
  shareToken: string;
  ownerToken: string;
  shareUrl: string;
  version: number;
}

export interface PublishedDocumentResponse {
  document: OpenJobsheetDocument;
  version: number;
  publishedAt: number;
  updatedAt: number;
}

/**
 * Collect all media IDs referenced by image blocks in the document.
 */
function collectMediaIds(doc: OpenJobsheetDocument): string[] {
  const ids: string[] = [];
  for (const section of doc.sections || []) {
    for (const step of section.steps || []) {
      for (const block of step.blocks || []) {
        if (block.type === "image" && block.mediaId) {
          ids.push(block.mediaId);
        }
      }
    }
  }
  return ids;
}

/**
 * Convert a Blob to a base64 string.
 */
async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Publish a local jobsheet to the Publishing Service.
 */
export async function publishJobsheet(
  documentId: string
): Promise<PublishResult> {
  // Load document from IndexedDB
  const record = await getJobsheetById(documentId);
  if (!record) {
    throw new Error("Jobsheet tidak ditemukan di perangkat ini.");
  }

  const doc = record.data;

  // Validate
  const validation = validateJobsheetDocument(doc);
  if (!validation.valid) {
    throw new Error(`Validasi gagal: ${validation.errors.join(", ")}`);
  }

  // Collect media
  const mediaIds = collectMediaIds(doc);
  const mediaItems: Array<{ mediaId: string; mimeType: string; base64: string }> = [];

  for (const mediaId of mediaIds) {
    const asset = await getMediaAsset(mediaId);
    if (!asset) {
      throw new Error(`Media ${mediaId} tidak ditemukan di IndexedDB.`);
    }
    const base64 = await blobToBase64(asset.blob);
    mediaItems.push({
      mediaId: asset.id,
      mimeType: asset.mimeType,
      base64,
    });
  }

  // Call API
  const response = await fetch("/api/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document: doc, mediaItems }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { error?: string }).error ||
        `Publikasi gagal (HTTP ${response.status}).`
    );
  }

  const result = (await response.json()) as PublishResult;

  // Save publication record locally
  const now = Date.now();
  await saveLocalPublication({
    publicationId: result.publicationId,
    documentId,
    shareToken: result.shareToken,
    ownerToken: result.ownerToken,
    shareUrl: result.shareUrl,
    status: "active",
    version: result.version,
    publishedAt: now,
    updatedAt: now,
  });

  return result;
}

/**
 * Update an existing publication with the latest local document.
 */
export async function updatePublishedJobsheet(
  publicationId: string,
  ownerToken: string,
  documentId: string
): Promise<{ version: number; updatedAt: number }> {
  const record = await getJobsheetById(documentId);
  if (!record) {
    throw new Error("Jobsheet tidak ditemukan di perangkat ini.");
  }

  const doc = record.data;
  const validation = validateJobsheetDocument(doc);
  if (!validation.valid) {
    throw new Error(`Validasi gagal: ${validation.errors.join(", ")}`);
  }

  const mediaIds = collectMediaIds(doc);
  const mediaItems: Array<{ mediaId: string; mimeType: string; base64: string }> = [];

  for (const mediaId of mediaIds) {
    const asset = await getMediaAsset(mediaId);
    if (!asset) {
      throw new Error(`Media ${mediaId} tidak ditemukan di IndexedDB.`);
    }
    const base64 = await blobToBase64(asset.blob);
    mediaItems.push({
      mediaId: asset.id,
      mimeType: asset.mimeType,
      base64,
    });
  }

  const response = await fetch(`/api/publish/${publicationId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-Owner-Token": ownerToken,
    },
    body: JSON.stringify({ document: doc, mediaItems }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { error?: string }).error ||
        `Update gagal (HTTP ${response.status}).`
    );
  }

  const result = (await response.json()) as { version: number; updatedAt: number };

  // Update local record
  const existing = (await getPublicationsByDocumentId(documentId)).find(
    (p) => p.publicationId === publicationId
  );
  if (existing) {
    await saveLocalPublication({
      ...existing,
      version: result.version,
      updatedAt: result.updatedAt,
    });
  }

  return result;
}

/**
 * Revoke access to a publication.
 */
export async function revokePublishedJobsheet(
  publicationId: string,
  ownerToken: string
): Promise<void> {
  const response = await fetch(`/api/publish/${publicationId}/revoke`, {
    method: "POST",
    headers: { "X-Owner-Token": ownerToken },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { error?: string }).error ||
        `Revoke gagal (HTTP ${response.status}).`
    );
  }

  await updateLocalPublicationStatus(publicationId, "revoked");
}

/**
 * Delete a publication permanently.
 */
export async function deletePublishedJobsheet(
  publicationId: string,
  ownerToken: string
): Promise<void> {
  const response = await fetch(`/api/publish/${publicationId}`, {
    method: "DELETE",
    headers: { "X-Owner-Token": ownerToken },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { error?: string }).error ||
        `Delete gagal (HTTP ${response.status}).`
    );
  }

  await deleteLocalPublication(publicationId);
}

/**
 * Fetch a published document by its publicationId and shareToken.
 */
export async function getPublishedDocument(
  publicationId: string,
  shareToken: string
): Promise<PublishedDocumentResponse> {
  const response = await fetch(
    `/api/publish/${publicationId}?token=${encodeURIComponent(shareToken)}`
  );

  if (response.status === 410) {
    throw new Error("REVOKED");
  }
  if (response.status === 404) {
    throw new Error("NOT_FOUND");
  }
  if (response.status === 403) {
    throw new Error("FORBIDDEN");
  }
  if (!response.ok) {
    throw new Error(`SERVER_ERROR`);
  }

  return (await response.json()) as PublishedDocumentResponse;
}
