/**
 * OpenJobsheet Canonical Document Schema Definition
 * Version: 1.0.0
 * Based on docs/DOCUMENT_SCHEMA.md & docs/PRD.md
 */

export type SchemaVersion = "1.0.0";

export type BlockType =
  | "paragraph"
  | "heading"
  | "image"
  | "code"
  | "callout"
  | "checklist"
  | "table"
  | "video";

export type CalloutVariant = "info" | "tip" | "warning" | "danger";

export interface ChecklistItem {
  id: string; // UUIDv4
  text: string;
  required: boolean;
  hint?: string;
}

export interface BaseBlock {
  id: string; // UUIDv4
  type: BlockType;
}

export interface ParagraphBlock extends BaseBlock {
  type: "paragraph";
  content: string;
}

export interface HeadingBlock extends BaseBlock {
  type: "heading";
  level: 1 | 2 | 3;
  text: string;
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  mediaId?: string;
  url?: string;
  altText: string;
  caption?: string;
}

export interface CodeBlock extends BaseBlock {
  type: "code";
  language: string;
  code: string;
  caption?: string;
  showLineNumbers: boolean;
}

export interface CalloutBlock extends BaseBlock {
  type: "callout";
  variant: CalloutVariant;
  title?: string;
  content: string;
}

export interface ChecklistBlock extends BaseBlock {
  type: "checklist";
  title?: string;
  items: ChecklistItem[];
}

export interface TableBlock extends BaseBlock {
  type: "table";
  caption?: string;
  headers: string[];
  rows: string[][];
}

export interface VideoBlock extends BaseBlock {
  type: "video";
  url: string;
  title?: string;
  caption?: string;
}

export type ContentBlock =
  | ParagraphBlock
  | HeadingBlock
  | ImageBlock
  | CodeBlock
  | CalloutBlock
  | ChecklistBlock
  | TableBlock
  | VideoBlock;

export interface PracticalStep {
  id: string;
  stepNumber: number;
  title: string;
  description?: string;
  estimatedMinutes?: number;
  blocks: ContentBlock[];
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  prerequisites?: string[];
  safetyOverview?: string;
  steps: PracticalStep[];
}

export interface DocumentAuthor {
  name: string;
  institution?: string;
  email?: string;
}

export interface DocumentSettings {
  allowStudentViewSwitch: boolean;
  defaultViewMode: "document" | "guided";
  showEstimatedDuration: boolean;
  strictStepProgression: boolean;
}

export interface OpenJobsheetDocument {
  id: string;
  schemaVersion: SchemaVersion;
  code?: string;
  category?: string;
  title: string;
  description: string;
  targetAudience?: string;
  estimatedDurationMinutes: number;
  author: DocumentAuthor;
  tags: string[];
  settings: DocumentSettings;
  sections: Section[];
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}

export interface StudentProgress {
  documentId: string;
  currentStepId: string;
  completedStepIds: string[];
  checkedItemIds: string[];
  startedAt: string;
  lastActiveAt: string;
  completedAt?: string;
}

/**
 * Local Publication Record — tracks publications made from this device.
 * Stored in IndexedDB alongside jobsheets.
 */
export interface LocalPublicationRecord {
  publicationId: string;
  documentId: string;
  shareToken: string;
  ownerToken: string;
  shareUrl: string;
  status: "active" | "revoked" | "deleted";
  version: number;
  publishedAt: number;
  updatedAt: number;
}

/**
 * IndexedDB Entity Records
 */
export interface JobsheetRecord {
  id: string;
  schemaVersion: string;
  title: string;
  code?: string;
  category?: string;
  estimatedMinutes: number;
  stepCount: number;
  authorName: string;
  data: OpenJobsheetDocument;
  createdAt: number; // Epoch timestamp
  updatedAt: number; // Epoch timestamp
}

export interface MediaRecord {
  id: string;
  documentId: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
  sizeBytes: number;
  createdAt: number;
}

export interface StudentProgressRecord {
  id?: string; // Optional compound or UUID key e.g. `${documentId}:${contextId}`
  documentId: string;
  contextId?: string; // Optional local learning context e.g. "default", "siswa-a", etc.
  currentStepId: string;
  completedStepIds: string[];
  checkedItemIds: string[];
  startedAt: number;
  lastActiveAt: number;
  completedAt?: number;
}

/**
 * Generate standard UUIDv4
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Safe fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create a fresh, valid blank jobsheet document adhering to the canonical schema
 */
export function createBlankJobsheet(title = "Jobsheet Baru Tanpa Judul"): OpenJobsheetDocument {
  const now = new Date().toISOString();
  const initialStepId = generateId();
  const initialSectionId = generateId();

  return {
    id: generateId(),
    schemaVersion: "1.0.0",
    code: "JOB-01",
    category: "Umum",
    title,
    description: "Deskripsi tujuan dan ruang lingkup kegiatan praktikum.",
    targetAudience: "Siswa SMK / Praktikan",
    estimatedDurationMinutes: 60,
    author: {
      name: "Instruktur",
      institution: "SMK / Laboratorium Teknik",
    },
    tags: ["Praktikum", "Dasar"],
    settings: {
      allowStudentViewSwitch: true,
      defaultViewMode: "guided",
      showEstimatedDuration: true,
      strictStepProgression: false,
    },
    sections: [
      {
        id: initialSectionId,
        title: "Tahap 1: Persiapan & Instruksi Kerja",
        description: "Langkah-langkah awal persiapan alat, bahan, dan keselamatan.",
        steps: [
          {
            id: initialStepId,
            stepNumber: 1,
            title: "Pemeriksaan Alat dan Bahan",
            description: "Verifikasi kelengkapan sebelum memulai pengerjaan.",
            estimatedMinutes: 15,
            blocks: [
              {
                id: generateId(),
                type: "callout",
                variant: "warning",
                title: "Perhatian Keselamatan Kerja",
                content:
                  "Pastikan menggunakan alat pelindung diri dan memeriksa kabel dalam keadaan tidak terhubung ke sumber daya listrik.",
              },
              {
                id: generateId(),
                type: "paragraph",
                content:
                  "Periksa meja kerja dan susun instrumen sesuai petunjuk instruktur sebelum memulai praktikum.",
              },
              {
                id: generateId(),
                type: "checklist",
                title: "Daftar Perlengkapan Wajib",
                items: [
                  {
                    id: generateId(),
                    text: "Perkakas tangan / alat utama telah siap di meja kerja",
                    required: true,
                  },
                  {
                    id: generateId(),
                    text: "Buku catatan kerja atau form praktikum telah disiapkan",
                    required: false,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Validate document integrity
 */
export function validateJobsheetDocument(doc: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!doc || typeof doc !== "object") {
    return { valid: false, errors: ["Dokumen harus berupa objek JSON yang valid."] };
  }

  const d = doc as Partial<OpenJobsheetDocument>;

  if (!d.id || typeof d.id !== "string") {
    errors.push("Dokumen harus memiliki 'id' berupa string UUID.");
  }
  if (!d.schemaVersion || (d.schemaVersion !== "1.0.0" && (d.schemaVersion as unknown) !== 1)) {
    errors.push("Versi schema tidak didukung (didukung: '1.0.0').");
  }
  if (!d.title || typeof d.title !== "string" || !d.title.trim()) {
    errors.push("Dokumen harus memiliki 'title' yang tidak kosong.");
  }
  if (!Array.isArray(d.sections)) {
    errors.push("Dokumen harus memiliki array 'sections'.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
