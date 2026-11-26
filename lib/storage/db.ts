import Dexie, { type Table } from "dexie";
import type {
  JobsheetRecord,
  MediaRecord,
  StudentProgressRecord,
  LocalPublicationRecord,
} from "../schema/document";

/**
 * OpenJobsheet IndexedDB Storage Engine (Dexie.js)
 * Adheres strictly to TECHNICAL_ARCHITECTURE.md Section 5
 */
export class OpenJobsheetDatabase extends Dexie {
  jobsheets!: Table<JobsheetRecord, string>;
  media_assets!: Table<MediaRecord, string>;
  student_progress!: Table<StudentProgressRecord, string>;
  settings!: Table<{ key: string; value: unknown }, string>;
  publications!: Table<LocalPublicationRecord, string>;

  constructor() {
    super("OpenJobsheetDB");
    this.version(1).stores({
      jobsheets: "id, schemaVersion, title, category, createdAt, updatedAt",
      media_assets: "id, documentId, mimeType, createdAt",
      student_progress: "documentId, lastActiveAt",
      settings: "key",
    });

    this.version(2).stores({
      jobsheets: "id, schemaVersion, title, category, createdAt, updatedAt",
      media_assets: "id, documentId, mimeType, createdAt",
      student_progress: "documentId, lastActiveAt",
      settings: "key",
      publications: "publicationId, documentId, status, publishedAt, updatedAt",
    });
  }
}

// Singleton database instance
export const db = new OpenJobsheetDatabase();
