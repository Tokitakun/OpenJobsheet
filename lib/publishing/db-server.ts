/**
 * Server-side SQLite database for OpenJobsheet Publishing.
 * Uses better-sqlite3 — synchronous, single-process, zero config.
 * Server-side ONLY — never import this in client components or pages.
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { PUBLISHING_CONFIG } from "./config";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PublicationRow {
  publicationId: string;
  shareTokenHash: string;
  ownerTokenHash: string;
  status: "active" | "revoked";
  documentTitle: string;
  currentVersion: number;
  createdAt: number; // epoch ms
  updatedAt: number;
  publishedAt: number;
  revokedAt: number | null;
}

export interface SnapshotRow {
  snapshotId: string;
  publicationId: string;
  version: number;
  documentJson: string; // serialised OpenJobsheetDocument
  mediaIds: string; // JSON array of mediaId strings
  createdAt: number;
}

export interface MediaRow {
  publicationId: string;
  mediaId: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
}

// ─── Singleton DB instance ────────────────────────────────────────────────────

let _db: Database.Database | null = null;

function ensureDataDir(): void {
  const dir = PUBLISHING_CONFIG.DATA_PATH;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const mediaDir = PUBLISHING_CONFIG.MEDIA_STORAGE_PATH;
  if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });
}

export function getDb(): Database.Database {
  if (_db) return _db;

  ensureDataDir();

  _db = new Database(PUBLISHING_CONFIG.DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  // ── Schema ──────────────────────────────────────────────────────────────
  _db.exec(`
    CREATE TABLE IF NOT EXISTS publications (
      publicationId   TEXT PRIMARY KEY,
      shareTokenHash  TEXT NOT NULL UNIQUE,
      ownerTokenHash  TEXT NOT NULL,
      status          TEXT NOT NULL DEFAULT 'active',
      documentTitle   TEXT NOT NULL DEFAULT '',
      currentVersion  INTEGER NOT NULL DEFAULT 1,
      createdAt       INTEGER NOT NULL,
      updatedAt       INTEGER NOT NULL,
      publishedAt     INTEGER NOT NULL,
      revokedAt       INTEGER
    );

    CREATE TABLE IF NOT EXISTS publication_snapshots (
      snapshotId      TEXT PRIMARY KEY,
      publicationId   TEXT NOT NULL REFERENCES publications(publicationId) ON DELETE CASCADE,
      version         INTEGER NOT NULL,
      documentJson    TEXT NOT NULL,
      mediaIds        TEXT NOT NULL DEFAULT '[]',
      createdAt       INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS publication_media (
      publicationId   TEXT NOT NULL REFERENCES publications(publicationId) ON DELETE CASCADE,
      mediaId         TEXT NOT NULL,
      filePath        TEXT NOT NULL,
      mimeType        TEXT NOT NULL DEFAULT 'image/jpeg',
      sizeBytes       INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (publicationId, mediaId)
    );
  `);

  return _db;
}

// ─── Query helpers ────────────────────────────────────────────────────────────

export function getPublication(publicationId: string): PublicationRow | null {
  const db = getDb();
  return (
    (db
      .prepare("SELECT * FROM publications WHERE publicationId = ?")
      .get(publicationId) as PublicationRow | undefined) ?? null
  );
}

export function getLatestSnapshot(publicationId: string): SnapshotRow | null {
  const db = getDb();
  return (
    (db
      .prepare(
        `SELECT * FROM publication_snapshots
         WHERE publicationId = ?
         ORDER BY version DESC
         LIMIT 1`
      )
      .get(publicationId) as SnapshotRow | undefined) ?? null
  );
}

export function getMediaRow(
  publicationId: string,
  mediaId: string
): MediaRow | null {
  const db = getDb();
  return (
    (db
      .prepare(
        "SELECT * FROM publication_media WHERE publicationId = ? AND mediaId = ?"
      )
      .get(publicationId, mediaId) as MediaRow | undefined) ?? null
  );
}

export function getAllMediaForPublication(
  publicationId: string
): MediaRow[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM publication_media WHERE publicationId = ?")
    .all(publicationId) as MediaRow[];
}

// ─── Write helpers ────────────────────────────────────────────────────────────

export interface CreatePublicationOptions {
  publicationId: string;
  shareTokenHash: string;
  ownerTokenHash: string;
  documentTitle: string;
  snapshotId: string;
  documentJson: string;
  mediaIds: string[];
  mediaFiles: Array<{
    mediaId: string;
    filePath: string;
    mimeType: string;
    sizeBytes: number;
  }>;
  now: number;
}

export function createPublication(opts: CreatePublicationOptions): void {
  const db = getDb();

  db.transaction(() => {
    db.prepare(
      `INSERT INTO publications
        (publicationId, shareTokenHash, ownerTokenHash, status, documentTitle,
         currentVersion, createdAt, updatedAt, publishedAt, revokedAt)
       VALUES (?, ?, ?, 'active', ?, 1, ?, ?, ?, NULL)`
    ).run(
      opts.publicationId,
      opts.shareTokenHash,
      opts.ownerTokenHash,
      opts.documentTitle,
      opts.now,
      opts.now,
      opts.now
    );

    db.prepare(
      `INSERT INTO publication_snapshots
        (snapshotId, publicationId, version, documentJson, mediaIds, createdAt)
       VALUES (?, ?, 1, ?, ?, ?)`
    ).run(
      opts.snapshotId,
      opts.publicationId,
      opts.documentJson,
      JSON.stringify(opts.mediaIds),
      opts.now
    );

    for (const mf of opts.mediaFiles) {
      db.prepare(
        `INSERT OR REPLACE INTO publication_media
          (publicationId, mediaId, filePath, mimeType, sizeBytes)
         VALUES (?, ?, ?, ?, ?)`
      ).run(
        opts.publicationId,
        mf.mediaId,
        mf.filePath,
        mf.mimeType,
        mf.sizeBytes
      );
    }
  })();
}

export interface UpdatePublicationOptions {
  publicationId: string;
  snapshotId: string;
  documentTitle: string;
  documentJson: string;
  mediaIds: string[];
  mediaFiles: Array<{
    mediaId: string;
    filePath: string;
    mimeType: string;
    sizeBytes: number;
  }>;
  newVersion: number;
  now: number;
  /** File paths of old media to delete from disk AFTER transaction succeeds. */
  oldMediaPaths: string[];
}

export function updatePublication(opts: UpdatePublicationOptions): void {
  const db = getDb();

  db.transaction(() => {
    db.prepare(
      `UPDATE publications
       SET documentTitle = ?, currentVersion = ?, updatedAt = ?
       WHERE publicationId = ?`
    ).run(
      opts.documentTitle,
      opts.newVersion,
      opts.now,
      opts.publicationId
    );

    // Replace snapshot for this version
    db.prepare(
      `INSERT OR REPLACE INTO publication_snapshots
        (snapshotId, publicationId, version, documentJson, mediaIds, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      opts.snapshotId,
      opts.publicationId,
      opts.newVersion,
      opts.documentJson,
      JSON.stringify(opts.mediaIds),
      opts.now
    );

    // Remove old media records for this publication
    db.prepare(
      "DELETE FROM publication_media WHERE publicationId = ?"
    ).run(opts.publicationId);

    // Insert new media records
    for (const mf of opts.mediaFiles) {
      db.prepare(
        `INSERT INTO publication_media
          (publicationId, mediaId, filePath, mimeType, sizeBytes)
         VALUES (?, ?, ?, ?, ?)`
      ).run(
        opts.publicationId,
        mf.mediaId,
        mf.filePath,
        mf.mimeType,
        mf.sizeBytes
      );
    }
  })();
}

export function revokePublication(
  publicationId: string,
  now: number
): void {
  getDb()
    .prepare(
      `UPDATE publications
       SET status = 'revoked', revokedAt = ?, updatedAt = ?
       WHERE publicationId = ?`
    )
    .run(now, now, publicationId);
}

export function deletePublicationRecord(publicationId: string): void {
  // CASCADE deletes snapshots and media rows automatically
  getDb()
    .prepare("DELETE FROM publications WHERE publicationId = ?")
    .run(publicationId);
}

export function mediaFilePath(
  publicationId: string,
  mediaId: string,
  ext: string
): string {
  const dir = path.join(
    PUBLISHING_CONFIG.MEDIA_STORAGE_PATH,
    publicationId
  );
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${mediaId}.${ext}`);
}
