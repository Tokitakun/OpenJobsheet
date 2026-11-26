# Technical Architecture Specification

## Document Information
- **Product Name:** OpenJobsheet
- **Document Version:** 1.0.0
- **Status:** Architectural Baseline (Specification Only)
- **Primary Audience:** Software Architects, Lead Developers, Open Source Contributors

---

## 1. Architectural Philosophy & Guiding Principles

OpenJobsheet is built around four non-negotiable architectural pillars:

1. **Local-First by Default:** The client application owns its data. Full read, write, edit, and execution functionality works reliably without network connectivity. Offline is an expected operational mode, not an edge case error.
2. **Unified Document Model (Single Source of Truth):** Both Creator Mode and Student Mode (Document View and Guided View) consume an identical Abstract Syntax Tree (AST) document representation.
3. **Strict Separation of Document and Execution State:** The jobsheet definition (structure, instructions, assets) is strictly immutable during student execution. Student progress (checked items, step navigation) is stored in a segregated state store.
4. **Data Portability & Zero Lock-In:** All content is serializable into clean, versioned, standardized JSON. Documents can be transported via file downloads, flash drives, or local networks without proprietary server constraints.
5. **Progressive Cloud Readiness:** Cloud synchronization and multi-device capabilities (Supabase) are designed as additive, optional post-MVP layers that integrate cleanly without re-architecting the core client engine.

---

## 2. Proposed Technology Stack

| Layer | Recommended Technology | Architectural Justification |
| :--- | :--- | :--- |
| **Runtime & Framework** | Next.js (React 19, TypeScript) | Industry-standard static export support (`output: 'export'`), strong typing, serverless readiness for future cloud features. |
| **Design & Tokens** | Tailwind CSS v4 + Semantic CSS Variables | Enforces token-based design system, zero runtime CSS overhead, dark mode class switching. |
| **Local Persistence** | Dexie.js (IndexedDB wrapper) | Transactional reliability, indexed queries, reactive live queries (`useLiveQuery`), large blob storage. |
| **Document AST Engine** | Custom Block AST + Zod Validator | Lean, polymorphic JSON schema; avoids bloated third-party rich-text document lock-in. |
| **State Management** | Zustand | Minimal bundle footprint (<2 KB), unopinionated, excellent performance outside React lifecycle for auto-save. |
| **Iconography** | Lucide React | Tree-shakeable, consistent stroke weight, strict semantic alignment with Design System. |
| **Image Compression** | `browser-image-compression` | Client-side Canvas-based resizing/compression to prevent IndexedDB storage bloat. |
| **Future Cloud Backend** | Supabase (PostgreSQL, Auth, Storage) | Open-source foundation, Row-Level Security (RLS), S3-compatible asset buckets, offline sync roadmap. |

---

## 3. High-Level System Architecture

The following diagram illustrates the client-side system architecture and the boundary between MVP local-first execution and future post-MVP cloud services:

```
+-----------------------------------------------------------------------------------------+
|                                    CLIENT APPLICATION                                   |
|                                                                                         |
|  +-----------------------------------------------------------------------------------+  |
|  |                             PRESENTATION LAYER (UI)                               |  |
|  |  +---------------------------+       +-----------------------------------------+  |  |
|  |  |       CREATOR MODE        |       |              STUDENT MODE               |  |  |
|  |  |  - Block Canvas Editor    |       |  +-----------------+ +----------------+ |  |  |
|  |  |  - Step Reorder List      |       |  |  Document View  | |  Guided View   | |  |  |
|  |  |  - Media Uploader/Paster  |       |  +-----------------+ +----------------+ |  |  |
|  |  |  - Document Settings      |       |        ^                    ^           |  |  |
|  |  +---------------------------+       +--------|--------------------|-----------+  |  |
|  +-----------------------------------------------|--------------------|--------------+  |
|                                                  | View Toggle        |                 |
|  +-----------------------------------------------|--------------------|--------------+  |
|  |                          DOMAIN & APPLICATION LAYER                               |  |
|  |                                                                                   |  |
|  |  +-----------------------------+               +-------------------------------+  |  |
|  |  |     Document AST Engine     |               |     Student Progress Engine   |  |  |
|  |  |  - Schema Validation (Zod)  |               |  - Checklist State Machine    |  |  |
|  |  |  - Block CRUD / Reordering  |               |  - Active Step Resolver       |  |  |
|  |  |  - Auto-Save Debouncer      |               |  - Completion Calculator      |  |  |
|  |  +-----------------------------+               +-------------------------------+  |  |
|  +-----------------------------------------------------------------------------------+  |
|                                           |                                             |
|  +----------------------------------------|------------------------------------------+  |
|  |                        PERSISTENCE & REPOSITORY LAYER                             |  |
|  |                                                                                   |  |
|  |  +-----------------------------------------------------------------------------+  |  |
|  |  |                    Storage Repository (Interface Adapter)                   |  |  |
|  |  +-----------------------------------------------------------------------------+  |  |
|  |                     |                                              |              |  |
|  |                     v                                              v              |  |
|  |  +--------------------------------------+      +-------------------------------+  |  |
|  |  |      IndexedDB Storage (Dexie.js)    |      |    JSON Import / Export Engine|  |  |
|  |  |  - jobsheets table                   |      |  - Serialize Document + Media |  |  |
|  |  |  - media_assets table (Blobs)        |      |  - Deserialize & Validate     |  |  |
|  |  |  - student_progress table            |      |  - Browser Print CSS          |  |  |
|  |  +--------------------------------------+      +-------------------------------+  |  |
|  +-----------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------+
                                           |
                                [POST-MVP EXTENSION]
                                           |
+------------------------------------------v----------------------------------------------+
|                           OPTIONAL CLOUD SERVICES (SUPABASE)                            |
|  - PostgreSQL Database (Jobsheet Mirror)     - Cloud Storage Buckets (Media Sync)       |
|  - Supabase Auth (Instructor Identity)       - Row Level Security (Access Control)      |
+-----------------------------------------------------------------------------------------+
```

---

## 4. Application Subsystem Architecture

### 4.1 Creator Mode Architecture
The Creator Mode is structured as an interactive block-based authoring environment:

1. **Document State Store:** Managed via Zustand. Holds the in-memory document AST, dirty state flags, and undo/redo stacks.
2. **Auto-Save Engine:**
   - Listens to document mutation events.
   - Debounces updates (500ms inactivity window).
   - Commits transactional snapshots to IndexedDB.
   - Emits a visual status indicator: `Saved`, `Saving...`, or `Offline Pending`.
3. **Block Component Registry:** Maps polymorphic block types (`paragraph`, `heading`, `image`, `code`, `callout`, `checklist`, `video`) to corresponding editor widgets.
4. **Media Ingestion Pipeline:** Intercepts drag-and-drop or clipboard paste events, converts raw files into WebP blobs, creates an asset record in the `media_assets` table, and references the generated `mediaId` in the block model.

### 4.2 Student Mode Architecture (Hybrid Engine)
The Student Mode renders documents strictly read-only and coordinates the dual-view interface:

1. **Hydration Phase:** Loads the document AST from IndexedDB (or from an imported file) into the student state store.
2. **Progress Initialization:** Checks for an existing progress record matching the `documentId`. If none exists, creates a fresh record in the `student_progress` table.
3. **View Synchronization Subsystem:**
   - **Document View:** Renders all sections and steps sequentially in a clean, scrollable column. A sticky Table of Contents listens to intersection observers to highlight the currently visible step.
   - **Guided View:** Renders an interactive stepper displaying only `steps[currentStepIndex]`. Controls trigger index increments/decrements.
   - **Switching Logic:** When switching views, the active step identifier is preserved. Switching to Document View scrolls the active step into view (`element.scrollIntoView({ behavior: 'smooth' })`). Switching to Guided View sets `currentStepIndex` to match the uppermost visible step in Document View.
4. **Task Verification Engine:** Clicking a checklist item toggles its ID in the progress store's `checkedItemIds` array and updates the step completion percentage in real time.

---

## 5. Local Storage Architecture (IndexedDB / Dexie.js)

The local persistence layer utilizes IndexedDB to ensure robust offline storage capacity (typically hundreds of megabytes per origin).

### 5.1 Database Schema Definition (`OpenJobsheetDB`)

```typescript
// Proposed Dexie database versioning schema
import Dexie, { Table } from 'dexie';

export interface JobsheetRecord {
  id: string;               // UUIDv4 (Primary Key)
  title: string;
  code?: string;
  schemaVersion: string;
  estimatedMinutes: number;
  stepCount: number;
  data: any;                // Full Document AST JSON
  createdAt: number;        // Epoch timestamp (Index)
  updatedAt: number;        // Epoch timestamp (Index)
}

export interface MediaRecord {
  id: string;               // UUIDv4 (Primary Key)
  documentId: string;       // Foreign index to JobsheetRecord
  fileName: string;
  mimeType: string;
  blob: Blob;               // Binary data
  sizeBytes: number;
  createdAt: number;
}

export interface StudentProgressRecord {
  documentId: string;       // Primary Key (one progress record per jobsheet)
  currentStepId: string;
  completedStepIds: string[];
  checkedItemIds: string[]; // Set of checked checklist UUIDs
  startedAt: number;
  lastActiveAt: number;
  completedAt?: number;
}

export interface SettingsRecord {
  key: string;              // Primary Key
  value: any;
}

export class OpenJobsheetDatabase extends Dexie {
  jobsheets!: Table<JobsheetRecord, string>;
  media_assets!: Table<MediaRecord, string>;
  student_progress!: Table<StudentProgressRecord, string>;
  settings!: Table<SettingsRecord, string>;

  constructor() {
    super('OpenJobsheetDB');
    this.version(1).stores({
      jobsheets: 'id, schemaVersion, title, createdAt, updatedAt',
      media_assets: 'id, documentId, mimeType, createdAt',
      student_progress: 'documentId, lastActiveAt',
      settings: 'key',
    });
  }
}
```

---

## 6. Media Pipeline & Asset Handling

1. **Ingestion:** When an author pastes or drops an image:
   - File size is checked against an upper safety limit (10MB).
   - If greater than 1920px wide/high or formatted as an uncompressed PNG/JPEG, it passes through `browser-image-compression` to produce an optimized WebP blob.
2. **Storage:** The blob is stored in the `media_assets` table. A stable local blob URL (`URL.createObjectURL(blob)`) is generated for UI rendering.
3. **Export Bundling:** During JSON export, the author can choose:
   - **Self-Contained Bundle:** All referenced media blobs are converted to base64 data URIs and embedded directly within the exported `.json` document.
   - **Lightweight Document:** Contains only document text and external web image URLs.

---

## 7. Import / Export Architecture

```
+---------------------------------------------------------------------------------+
|                                 IMPORT PIPELINE                                 |
|                                                                                 |
|  [JSON File] ---> (Parse JSON) ---> (Zod Schema Validation) ---> [Valid AST?]   |
|                                                                      |          |
|                                     +--------------------------------+          |
|                                     | Yes                            | No       |
|                                     v                                v          |
|                          (Extract Media Blobs)             (Throw Detailed UI   |
|                                     |                       Error Dialog)       |
|                                     v                                           |
|                         (Write to IndexedDB)                                    |
|                                     |                                           |
|                                     v                                           |
|                          [Open in Creator/Student]                              |
+---------------------------------------------------------------------------------+
```

- **Validation:** Every imported document is parsed through a strict Zod validator corresponding to its declared `schemaVersion`.
- **Migration Hooks:** If `schemaVersion` is older than the current application version, an automated AST migrator updates the structure sequentially before writing to storage.

---

## 8. Future Cloud Architecture (Post-MVP Roadmap)

When cloud synchronization is introduced, it will extend—rather than replace—the local-first foundation.

```
+-----------------------------+               +-----------------------------+
|    Client (Local-First)     |               |    Cloud Backend (Supabase) |
|                             |               |                             |
|  +-----------------------+  |   REST / WS   |  +-----------------------+  |
|  | IndexedDB (Local DB)  | <=================> | PostgreSQL Database   |  |
|  +-----------------------+  |  Sync Engine  |  +-----------------------+  |
|                             |               |  - Row Level Security (RLS) |
|  +-----------------------+  |   S3 API      |  +-----------------------+  |
|  | Media Blobs           | <=================> | Supabase Storage Bucket|  |
|  +-----------------------+  |               |  +-----------------------+  |
+-----------------------------+               +-----------------------------+
```

### Key Cloud Features:
- **Supabase Authentication:** Instructors authenticate to claim ownership of cloud documents.
- **Sync Protocol:** Last-write-wins (LWW) with timestamp hashing for initial synchronization; optional CRDT-backed differential sync for real-time collaboration.
- **Row Level Security (RLS):** Policies ensure authors can only mutate their own jobsheets, while published jobsheets are readable anonymously by students via a public sharing link.

---

## 9. Security, Privacy & Error Handling Boundaries

### 9.1 Client Security Measures
- **Content Sanitization:** Markdown and text blocks are rendered through a sanitized pipeline (e.g., DOMPurify) to prevent cross-site scripting (XSS) via imported documents.
- **Strict Content Security Policy (CSP):** Prohibits inline execution of untrusted scripts and restricts media sources to local blobs and whitelisted external media domains (e.g., YouTube video embeds).
- **Zero Telemetry by Default:** No user-tracking scripts, third-party analytics pixels, or biometric trackers are loaded.

### 9.2 Error Handling & Resilience Strategies
- **Storage Quota Exceeded:** The application catches `QuotaExceededError` during IndexedDB writes, alerts the user with current storage metrics, and prompts them to prune old jobsheets or export archives.
- **Corrupted Document Guard:** If an AST fails validation during retrieval, a raw JSON recovery modal allows the instructor to download the uncorrupted text fragments before resetting the record.

---

## 10. Suggested Project Directory Structure

```
opensheet/
├── docs/                             # Project specifications & architecture
│   ├── PRD.md
│   ├── DESIGN_SYSTEM.md
│   ├── TECHNICAL_ARCHITECTURE.md
│   ├── DOCUMENT_SCHEMA.md
│   ├── USER_FLOWS.md
│   ├── MVP_ROADMAP.md
│   ├── CONTRIBUTING.md
│   └── DECISIONS.md
├── src/
│   ├── app/                          # Next.js App Router (Page routing)
│   │   ├── (creator)/
│   │   │   └── editor/[id]/          # Creator Mode Canvas
│   │   ├── (student)/
│   │   │   └── view/[id]/            # Student Hybrid Mode (Doc & Guided)
│   │   ├── layout.tsx
│   │   └── page.tsx                  # Home & Local Library
│   ├── core/                         # Pure domain logic (framework-agnostic)
│   │   ├── schema/                   # Zod definitions and JSON Schema
│   │   ├── types/                    # TypeScript interfaces
│   │   ├── migrations/               # Schema version upgraders
│   │   └── parser/                   # Document AST parsing & serialization
│   ├── features/                     # Feature-specific components and state
│   │   ├── editor/                   # Creator Mode blocks and toolbars
│   │   ├── student/                  # Document View and Guided Stepper
│   │   └── storage/                  # Dexie.js database and repository adapters
│   ├── components/                   # Shared UI component library
│   │   ├── ui/                       # Buttons, Dialogs, Inputs, Tabs
│   │   └── layout/                   # Header, Navigation, Footer
│   └── lib/                          # Utility functions
│       ├── compression.ts            # Client-side image optimization
│       └── export.ts                 # JSON bundle packaging & file downloads
├── public/                           # Static assets
├── LICENSE
├── package.json
└── tsconfig.json
```
