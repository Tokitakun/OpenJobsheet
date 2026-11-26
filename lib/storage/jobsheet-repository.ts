import { db } from "./db";
import {
  OpenJobsheetDocument,
  JobsheetRecord,
  MediaRecord,
  StudentProgressRecord,
  LocalPublicationRecord,
  validateJobsheetDocument,
  generateId,
} from "../schema/document";

/**
 * Helper to calculate metadata statistics from a document AST
 */
export function calculateDocumentStats(doc: OpenJobsheetDocument) {
  let stepCount = 0;
  let totalEstimatedMinutes = 0;

  if (Array.isArray(doc.sections)) {
    for (const section of doc.sections) {
      if (Array.isArray(section.steps)) {
        stepCount += section.steps.length;
        for (const step of section.steps) {
          if (typeof step.estimatedMinutes === "number" && step.estimatedMinutes > 0) {
            totalEstimatedMinutes += step.estimatedMinutes;
          }
        }
      }
    }
  }

  return {
    stepCount,
    estimatedMinutes: totalEstimatedMinutes || doc.estimatedDurationMinutes || 60,
  };
}

/**
 * Get all stored jobsheet records ordered by latest update
 */
export async function getAllJobsheets(): Promise<JobsheetRecord[]> {
  try {
    return await db.jobsheets.orderBy("updatedAt").reverse().toArray();
  } catch (error) {
    console.error("Failed to query jobsheets from IndexedDB:", error);
    return [];
  }
}

/**
 * Retrieve a specific jobsheet record by its ID
 */
export async function getJobsheetById(id: string): Promise<JobsheetRecord | undefined> {
  try {
    return await db.jobsheets.get(id);
  } catch (error) {
    console.error(`Failed to fetch jobsheet ${id} from IndexedDB:`, error);
    return undefined;
  }
}

/**
 * Save (create or update) a jobsheet document in IndexedDB
 */
export async function saveJobsheet(doc: OpenJobsheetDocument): Promise<JobsheetRecord> {
  const validation = validateJobsheetDocument(doc);
  if (!validation.valid) {
    throw new Error(`Validasi gagal: ${validation.errors.join(", ")}`);
  }

  const nowEpoch = Date.now();
  const nowIso = new Date().toISOString();
  const stats = calculateDocumentStats(doc);

  // Update timestamps
  doc.updatedAt = nowIso;
  if (!doc.createdAt) {
    doc.createdAt = nowIso;
  }

  const existing = await db.jobsheets.get(doc.id);
  const createdEpoch = existing?.createdAt || nowEpoch;

  const record: JobsheetRecord = {
    id: doc.id,
    schemaVersion: doc.schemaVersion,
    title: doc.title,
    code: doc.code,
    category: doc.category || "Umum",
    estimatedMinutes: stats.estimatedMinutes,
    stepCount: stats.stepCount,
    authorName: doc.author?.name || "Instruktur",
    data: doc,
    createdAt: createdEpoch,
    updatedAt: nowEpoch,
  };

  await db.jobsheets.put(record);
  return record;
}

/**
 * Delete a jobsheet and its associated progress and media records
 */
export async function deleteJobsheet(id: string): Promise<void> {
  try {
    await db.transaction("rw", [db.jobsheets, db.student_progress, db.media_assets], async () => {
      await db.jobsheets.delete(id);
      await db.student_progress.delete(id);
      await db.media_assets.where("documentId").equals(id).delete();
    });
  } catch (error) {
    console.error(`Failed to delete jobsheet ${id}:`, error);
    throw error;
  }
}

/**
 * Duplicate an existing jobsheet under a new UUID
 */
export async function duplicateJobsheet(id: string): Promise<JobsheetRecord> {
  const source = await getJobsheetById(id);
  if (!source) {
    throw new Error(`Jobsheet dengan ID ${id} tidak ditemukan.`);
  }

  const newId = generateId();
  const nowIso = new Date().toISOString();

  // Deep clone and assign new IDs
  const clonedData: OpenJobsheetDocument = JSON.parse(JSON.stringify(source.data));
  clonedData.id = newId;
  clonedData.title = `${clonedData.title} (Salinan)`;
  clonedData.createdAt = nowIso;
  clonedData.updatedAt = nowIso;

  // Re-id sections and steps to ensure strict independence
  if (Array.isArray(clonedData.sections)) {
    for (const section of clonedData.sections) {
      section.id = generateId();
      if (Array.isArray(section.steps)) {
        for (const step of section.steps) {
          step.id = generateId();
          if (Array.isArray(step.blocks)) {
            for (const block of step.blocks) {
              block.id = generateId();
              if (block.type === "checklist" && Array.isArray(block.items)) {
                for (const item of block.items) {
                  item.id = generateId();
                }
              }
            }
          }
        }
      }
    }
  }

  return await saveJobsheet(clonedData);
}

/**
 * Retrieve student progress for a specific document and optional learning context
 */
export async function getStudentProgress(
  documentId: string,
  contextId: string = "default"
): Promise<StudentProgressRecord | undefined> {
  try {
    const key = contextId === "default" ? documentId : `${documentId}:${contextId}`;
    let record = await db.student_progress.get(key);
    if (!record && contextId === "default") {
      // Direct lookup by documentId
      record = await db.student_progress.get(documentId);
    }
    return record;
  } catch (error) {
    console.error(`Failed to fetch student progress for ${documentId}:`, error);
    return undefined;
  }
}

/**
 * Save or update student progress record
 */
export async function saveStudentProgress(
  progress: StudentProgressRecord
): Promise<void> {
  try {
    const contextId = progress.contextId || "default";
    const key = contextId === "default" ? progress.documentId : `${progress.documentId}:${contextId}`;
    progress.documentId = key;
    progress.contextId = contextId;
    progress.lastActiveAt = Date.now();
    if (!progress.startedAt) {
      progress.startedAt = Date.now();
    }
    await db.student_progress.put(progress);
  } catch (error) {
    console.error("Failed to save student progress:", error);
    throw error;
  }
}

// -----------------------------------------------------------------------------
// Media Assets Storage Layer (IndexedDB Blobs)
// -----------------------------------------------------------------------------

/**
 * Save an uploaded image file as a Blob in IndexedDB
 */
export async function saveMediaAsset(
  documentId: string,
  file: File | Blob,
  fileName: string = "image.png"
): Promise<MediaRecord> {
  const mediaId = generateId();
  const record: MediaRecord = {
    id: mediaId,
    documentId,
    fileName,
    mimeType: file.type || "image/png",
    blob: file,
    sizeBytes: file.size,
    createdAt: Date.now(),
  };

  try {
    await db.media_assets.put(record);
    return record;
  } catch (error) {
    console.error("Failed to save media asset to IndexedDB:", error);
    throw error;
  }
}

/**
 * Retrieve a media asset record by its UUID
 */
export async function getMediaAsset(
  mediaId: string
): Promise<MediaRecord | undefined> {
  try {
    return await db.media_assets.get(mediaId);
  } catch (error) {
    console.error(`Failed to fetch media asset ${mediaId}:`, error);
    return undefined;
  }
}

/**
 * Delete a media asset by its UUID
 */
export async function deleteMediaAsset(mediaId: string): Promise<void> {
  try {
    await db.media_assets.delete(mediaId);
  } catch (error) {
    console.error(`Failed to delete media asset ${mediaId}:`, error);
    throw error;
  }
}

// -----------------------------------------------------------------------------
// Local Publication Records (track publications made from this device)
// -----------------------------------------------------------------------------

/**
 * Get all publication records for a specific local document
 */
export async function getPublicationsByDocumentId(
  documentId: string
): Promise<LocalPublicationRecord[]> {
  try {
    return await db.publications.where("documentId").equals(documentId).toArray();
  } catch (error) {
    console.error(`Failed to fetch publications for ${documentId}:`, error);
    return [];
  }
}

/**
 * Get a publication record by publicationId
 */
export async function getLocalPublication(
  publicationId: string
): Promise<LocalPublicationRecord | undefined> {
  try {
    return await db.publications.get(publicationId);
  } catch (error) {
    console.error(`Failed to fetch publication ${publicationId}:`, error);
    return undefined;
  }
}

/**
 * Save or update a local publication record
 */
export async function saveLocalPublication(
  record: LocalPublicationRecord
): Promise<void> {
  try {
    await db.publications.put(record);
  } catch (error) {
    console.error("Failed to save local publication:", error);
    throw error;
  }
}

/**
 * Delete a local publication record
 */
export async function deleteLocalPublication(
  publicationId: string
): Promise<void> {
  try {
    await db.publications.delete(publicationId);
  } catch (error) {
    console.error(`Failed to delete local publication ${publicationId}:`, error);
    throw error;
  }
}

/**
 * Update the status of a local publication record
 */
export async function updateLocalPublicationStatus(
  publicationId: string,
  status: "active" | "revoked" | "deleted"
): Promise<void> {
  try {
    await db.publications.update(publicationId, {
      status,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error(`Failed to update publication status ${publicationId}:`, error);
    throw error;
  }
}

/**
 * Get all media assets for a document (used by publishing service)
 */
export async function getMediaAssetsByDocumentId(
  documentId: string
): Promise<MediaRecord[]> {
  try {
    return await db.media_assets.where("documentId").equals(documentId).toArray();
  } catch (error) {
    console.error(`Failed to fetch media assets for ${documentId}:`, error);
    return [];
  }
}

/**
 * Get all local publication records stored on this device
 */
export async function getAllLocalPublications(): Promise<LocalPublicationRecord[]> {
  try {
    return await db.publications.toArray();
  } catch (error) {
    console.error("Failed to fetch all local publications:", error);
    return [];
  }
}

// -----------------------------------------------------------------------------
// Local User Preferences (Dexie settings table)
// -----------------------------------------------------------------------------

/**
 * Read a local user setting by key
 */
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const entry = await db.settings.get(key);
    if (entry && entry.value !== undefined) {
      return entry.value as T;
    }
    return fallback;
  } catch (error) {
    console.error(`Failed to read setting ${key}:`, error);
    return fallback;
  }
}

/**
 * Persist a local user setting by key
 */
export async function setSetting<T>(key: string, value: T): Promise<void> {
  try {
    await db.settings.put({ key, value });
  } catch (error) {
    console.error(`Failed to save setting ${key}:`, error);
  }
}
