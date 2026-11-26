/**
 * OpenJobsheet Data Portability Service (.jobsheet ZIP package)
 * Phase 6 — Export & Import Jobsheet (100% client-side, local-first)
 *
 * Package structure:
 * - manifest.json
 * - document.json (OpenJobsheetDocument v1.0.0)
 * - media/<mediaId>.<ext>
 */

import JSZip from "jszip";
import type {
  OpenJobsheetDocument,
  JobsheetRecord,
  MediaRecord,
} from "@/lib/schema/document";
import {
  generateId,
  validateJobsheetDocument,
} from "@/lib/schema/document";
import { db } from "@/lib/storage/db";
import {
  calculateDocumentStats,
  getJobsheetById,
  getMediaAsset,
} from "@/lib/storage/jobsheet-repository";

export const PACKAGE_FORMAT = "openjobsheet-package";
export const PACKAGE_VERSION = "1.0.0";
export const MAX_IMPORT_FILE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_MEDIA_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export interface PackageMediaEntry {
  mediaId: string;
  entryName: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface JobsheetPackageManifest {
  format: string;
  packageVersion: string;
  schemaVersion: string;
  exportedAt: string;
  documentId: string;
  title: string;
  mediaCount: number;
  media: PackageMediaEntry[];
}

export interface ParsedPackageMedia {
  mediaId: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
  sizeBytes: number;
}

export interface JobsheetImportPreview {
  document: OpenJobsheetDocument;
  mediaItems: ParsedPackageMedia[];
  title: string;
  code: string;
  category: string;
  stepCount: number;
  estimatedMinutes: number;
  authorName: string;
  mediaCount: number;
  isDuplicateId: boolean;
}

export interface JobsheetImportResult {
  record: JobsheetRecord;
  importedAsCopy: boolean;
}

/**
 * Sanitize jobsheet title into a safe .jobsheet filename.
 */
export function sanitizeJobsheetFilename(title: string): string {
  const cleaned = (title || "jobsheet")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s\-_]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  return `${cleaned || "jobsheet"}.jobsheet`;
}

function extensionFromMime(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

/**
 * Collect unique mediaIds referenced by ImageBlocks in a document.
 */
function collectReferencedMediaIds(doc: OpenJobsheetDocument): string[] {
  const seen = new Set<string>();
  for (const section of doc.sections || []) {
    for (const step of section.steps || []) {
      for (const block of step.blocks || []) {
        if (block.type === "image" && block.mediaId) {
          seen.add(block.mediaId);
        }
      }
    }
  }
  return Array.from(seen);
}

/**
 * Validate safe archive path (prevents path traversal).
 */
function isSafeMediaEntryName(entryName: string): boolean {
  return /^media\/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp)$/i.test(entryName);
}

/**
 * Build a .jobsheet Blob from a local document and its IndexedDB media assets.
 */
export async function buildJobsheetPackageBlob(
  documentId: string
): Promise<{ blob: Blob; filename: string }> {
  const record = await getJobsheetById(documentId);
  if (!record) {
    throw new Error("Jobsheet tidak ditemukan di penyimpanan lokal.");
  }

  const doc = record.data;
  const validation = validateJobsheetDocument(doc);
  if (!validation.valid) {
    throw new Error(
      `Dokumen tidak valid untuk diekspor: ${validation.errors.join(", ")}`
    );
  }

  const zip = new JSZip();
  const mediaIds = collectReferencedMediaIds(doc);
  const manifestMedia: PackageMediaEntry[] = [];

  for (const mediaId of mediaIds) {
    const asset = await getMediaAsset(mediaId);
    if (!asset) {
      throw new Error(
        `Gambar dengan ID ${mediaId} tidak ditemukan di penyimpanan lokal.`
      );
    }

    const ext = extensionFromMime(asset.mimeType);
    const entryName = `media/${asset.id}.${ext}`;
    const buffer = await asset.blob.arrayBuffer();

    zip.file(entryName, buffer);
    manifestMedia.push({
      mediaId: asset.id,
      entryName,
      fileName: asset.fileName || `${asset.id}.${ext}`,
      mimeType: asset.mimeType || "image/png",
      sizeBytes: asset.sizeBytes || buffer.byteLength,
    });
  }

  const manifest: JobsheetPackageManifest = {
    format: PACKAGE_FORMAT,
    packageVersion: PACKAGE_VERSION,
    schemaVersion: doc.schemaVersion,
    exportedAt: new Date().toISOString(),
    documentId: doc.id,
    title: doc.title,
    mediaCount: manifestMedia.length,
    media: manifestMedia,
  };

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  zip.file("document.json", JSON.stringify(doc, null, 2));

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return {
    blob,
    filename: sanitizeJobsheetFilename(doc.title),
  };
}

/**
 * Trigger browser download of a .jobsheet file.
 */
export async function exportJobsheetFile(documentId: string): Promise<string> {
  const { blob, filename } = await buildJobsheetPackageBlob(documentId);
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    URL.revokeObjectURL(url);
  }
  return filename;
}

/**
 * Inspect and validate a .jobsheet File / ArrayBuffer before importing.
 * Throws a clear Indonesian error message if invalid or corrupted.
 */
export async function inspectJobsheetPackage(
  input: File | ArrayBuffer
): Promise<JobsheetImportPreview> {
  const size = input instanceof ArrayBuffer ? input.byteLength : input.size;
  if (size <= 0) {
    throw new Error("File kosong atau tidak dapat dibaca.");
  }
  if (size > MAX_IMPORT_FILE_BYTES) {
    throw new Error(
      "Ukuran file melebihi batas maksimum 25 MB."
    );
  }

  let zip: JSZip;
  try {
    const data = input instanceof ArrayBuffer ? input : await input.arrayBuffer();
    zip = await JSZip.loadAsync(data);
  } catch {
    throw new Error(
      "File tidak valid atau rusak. Pastikan Anda memilih file .jobsheet yang benar."
    );
  }

  // 1. Validate manifest.json
  const manifestFile = zip.file("manifest.json");
  if (!manifestFile) {
    throw new Error(
      "Format file tidak valid: manifest.json tidak ditemukan di dalam paket."
    );
  }

  let manifest: JobsheetPackageManifest;
  try {
    const manifestText = await manifestFile.async("string");
    manifest = JSON.parse(manifestText) as JobsheetPackageManifest;
  } catch {
    throw new Error("File manifest.json rusak atau bukan JSON yang valid.");
  }

  if (manifest.format !== PACKAGE_FORMAT) {
    throw new Error("Format file ini bukan paket OpenJobsheet yang valid.");
  }
  if (manifest.packageVersion !== PACKAGE_VERSION) {
    throw new Error(
      `Versi paket (${manifest.packageVersion || "tidak diketahui"}) tidak kompatibel.`
    );
  }
  if (manifest.schemaVersion !== "1.0.0") {
    throw new Error(
      `Versi skema dokumen (${manifest.schemaVersion || "tidak diketahui"}) tidak didukung.`
    );
  }

  // 2. Validate document.json
  const docFile = zip.file("document.json");
  if (!docFile) {
    throw new Error(
      "Format file tidak valid: document.json tidak ditemukan di dalam paket."
    );
  }

  let doc: OpenJobsheetDocument;
  try {
    const docText = await docFile.async("string");
    doc = JSON.parse(docText) as OpenJobsheetDocument;
  } catch {
    throw new Error("Isi document.json rusak atau tidak dapat dibaca.");
  }

  const validation = validateJobsheetDocument(doc);
  if (!validation.valid) {
    throw new Error(`Struktur jobsheet tidak valid: ${validation.errors.join(", ")}`);
  }

  // 3. Validate referenced media & extract blobs safely
  const referencedIds = collectReferencedMediaIds(doc);
  const manifestMediaList = Array.isArray(manifest.media) ? manifest.media : [];
  const manifestById = new Map<string, PackageMediaEntry>();

  for (const entry of manifestMediaList) {
    if (!entry.mediaId || !entry.entryName) {
      throw new Error("Metadata gambar di dalam paket tidak lengkap.");
    }
    if (!isSafeMediaEntryName(entry.entryName)) {
      throw new Error(
        `Path media tidak aman atau tidak valid: ${entry.entryName}`
      );
    }
    if (
      !ALLOWED_MIME_TYPES.includes(
        entry.mimeType as (typeof ALLOWED_MIME_TYPES)[number]
      )
    ) {
      throw new Error(`Tipe gambar tidak didukung: ${entry.mimeType}`);
    }
    manifestById.set(entry.mediaId, entry);
  }

  for (const refId of referencedIds) {
    if (!manifestById.has(refId)) {
      throw new Error(
        `Gambar yang direferensikan dokumen (${refId}) tidak ada di dalam paket.`
      );
    }
  }

  const mediaItems: ParsedPackageMedia[] = [];
  for (const entry of manifestMediaList) {
    const zipEntry = zip.file(entry.entryName);
    if (!zipEntry) {
      throw new Error(
        `Berkas gambar ${entry.fileName || entry.mediaId} hilang dari paket.`
      );
    }

    const bytes = await zipEntry.async("uint8array");
    if (bytes.byteLength === 0) {
      throw new Error(
        `Berkas gambar ${entry.fileName || entry.mediaId} kosong atau rusak.`
      );
    }
    if (bytes.byteLength > MAX_MEDIA_FILE_BYTES) {
      throw new Error(
        `Ukuran gambar ${entry.fileName || entry.mediaId} melebihi batas 5 MB.`
      );
    }

    const bufferCopy = new Uint8Array(bytes.byteLength);
    bufferCopy.set(bytes);
    const blob = new Blob([bufferCopy.buffer], { type: entry.mimeType });
    mediaItems.push({
      mediaId: entry.mediaId,
      fileName: entry.fileName,
      mimeType: entry.mimeType,
      blob,
      sizeBytes: bytes.byteLength,
    });
  }

  // 4. Check for duplicate document ID in existing IndexedDB
  const existing = await getJobsheetById(doc.id);
  const stats = calculateDocumentStats(doc);

  return {
    document: doc,
    mediaItems,
    title: doc.title,
    code: doc.code || "JOB",
    category: doc.category || "Umum",
    stepCount: stats.stepCount,
    estimatedMinutes: stats.estimatedMinutes,
    authorName: doc.author?.name || "Instruktur",
    mediaCount: mediaItems.length,
    isDuplicateId: Boolean(existing),
  };
}

/**
 * Commit a validated import preview into IndexedDB atomically.
 * Never overwrites an existing document; assigns new document & media IDs if ID already exists.
 */
export async function commitJobsheetImport(
  preview: JobsheetImportPreview
): Promise<JobsheetImportResult> {
  const clonedDoc: OpenJobsheetDocument = JSON.parse(
    JSON.stringify(preview.document)
  );
  const nowEpoch = Date.now();
  const nowIso = new Date(nowEpoch).toISOString();

  // Check again at commit time to guarantee safety against race conditions
  const existingDoc = await getJobsheetById(clonedDoc.id);
  const importedAsCopy = Boolean(existingDoc) || preview.isDuplicateId;

  const mediaIdMap = new Map<string, string>();
  for (const media of preview.mediaItems) {
    // Always remap mediaId when importing as a copy (or if mediaId already exists in DB)
    const existingMedia = await getMediaAsset(media.mediaId);
    const nextMediaId =
      importedAsCopy || existingMedia ? generateId() : media.mediaId;
    mediaIdMap.set(media.mediaId, nextMediaId);
  }

  if (importedAsCopy) {
    clonedDoc.id = generateId();
    clonedDoc.title = `${clonedDoc.title} (Impor)`;
    clonedDoc.createdAt = nowIso;
  }
  clonedDoc.updatedAt = nowIso;

  // Remap block.mediaId references if needed
  for (const section of clonedDoc.sections || []) {
    for (const step of section.steps || []) {
      for (const block of step.blocks || []) {
        if (block.type === "image" && block.mediaId) {
          const mapped = mediaIdMap.get(block.mediaId);
          if (mapped) {
            block.mediaId = mapped;
          }
        }
      }
    }
  }

  const stats = calculateDocumentStats(clonedDoc);
  const record: JobsheetRecord = {
    id: clonedDoc.id,
    schemaVersion: clonedDoc.schemaVersion,
    title: clonedDoc.title,
    code: clonedDoc.code,
    category: clonedDoc.category || "Umum",
    estimatedMinutes: stats.estimatedMinutes,
    stepCount: stats.stepCount,
    authorName: clonedDoc.author?.name || "Instruktur",
    data: clonedDoc,
    createdAt: nowEpoch,
    updatedAt: nowEpoch,
  };

  const mediaRecords: MediaRecord[] = preview.mediaItems.map((m) => ({
    id: mediaIdMap.get(m.mediaId) || m.mediaId,
    documentId: clonedDoc.id,
    fileName: m.fileName,
    mimeType: m.mimeType,
    blob: m.blob,
    sizeBytes: m.sizeBytes,
    createdAt: nowEpoch,
  }));

  // Atomic Dexie transaction: all or nothing
  await db.transaction("rw", [db.jobsheets, db.media_assets], async () => {
    await db.jobsheets.put(record);
    for (const mr of mediaRecords) {
      await db.media_assets.put(mr);
    }
  });

  return {
    record,
    importedAsCopy,
  };
}
