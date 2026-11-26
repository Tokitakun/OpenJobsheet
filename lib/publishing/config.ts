/**
 * OpenJobsheet Publishing Configuration
 * Phase 4 — Cloud Publishing & Share Access
 */

import path from "path";

/** Resolve a path relative to the Next.js project root (cwd at build/runtime). */
function projectPath(...segments: string[]): string {
  return path.join(process.cwd(), ...segments);
}

export const PUBLISHING_CONFIG = {
  /** Max size of the serialised document AST (excluding media). */
  MAX_DOCUMENT_SIZE_BYTES: 2 * 1024 * 1024, // 2 MB

  /** Max size for a single media file. */
  MAX_MEDIA_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB

  /** Max cumulative media upload per publication. */
  MAX_TOTAL_MEDIA_BYTES: 20 * 1024 * 1024, // 20 MB

  /** Allowed image MIME types. */
  ALLOWED_MEDIA_TYPES: ["image/jpeg", "image/png", "image/webp"] as const,

  /** Directory where published media files are stored on disk. */
  MEDIA_STORAGE_PATH: projectPath("data", "media"),

  /** SQLite database file path. */
  DB_PATH: projectPath("data", "openjobsheet-publishing.db"),

  /** Directory for all server-side data. */
  DATA_PATH: projectPath("data"),
};
