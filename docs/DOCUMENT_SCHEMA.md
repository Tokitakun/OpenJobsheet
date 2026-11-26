# OpenJobsheet Document Schema Specification

## Specification Information
- **Schema Name:** `openjobsheet-document-schema`
- **Current Schema Version:** `1.0.0`
- **Format:** JSON / TypeScript Interface Definition
- **Validation Engine:** Zod (`schemaVersion: "1.0.0"`)

---

## 1. Schema Philosophy & Design Principles

The OpenJobsheet document schema represents the canonical data structure for technical worksheets.

1. **Single Source of Truth:** Creator Mode (the editor) and Student Mode (both Document View and Guided View) consume this exact structure.
2. **Polymorphic Block Model:** Instructional content is structured as an array of typed block objects, allowing extensible addition of new block types without breaking legacy documents.
3. **Decoupled Execution State:** The document schema defines instructional intent only. Dynamic runtime states (such as whether a student checked a box or is currently viewing Step 3) are strictly isolated into a separate `StudentProgress` schema.
4. **Self-Contained Data Portability:** A serialized `.json` document contains all text, structure, settings, and metadata needed to render the worksheet. Media can either be referenced as URLs or embedded as base64-encoded assets for offline sharing.

---

## 2. Core TypeScript Interfaces

```typescript
export type SchemaVersion = "1.0.0";

export type BlockType =
  | "paragraph"
  | "heading"
  | "image"
  | "code"
  | "video"
  | "callout"
  | "checklist"
  | "table";

export type CalloutVariant = "info" | "tip" | "warning" | "danger";

export interface MediaAssetRef {
  mediaId: string;            // UUIDv4 matching local storage key
  fileName: string;
  mimeType: string;
  sizeBytes?: number;
  dataBase64?: string;        // Present when exported as a bundled standalone archive
}

export interface DocumentSettings {
  allowStudentViewSwitch: boolean; // Allows toggling between Document and Guided Views
  defaultViewMode: "document" | "guided";
  showEstimatedDuration: boolean;
  strictStepProgression: boolean;  // Requires all required checklist items in step N before step N+1
}

export interface DocumentAuthor {
  name: string;
  institution?: string;
  email?: string;
}

export interface ChecklistItem {
  id: string;                 // UUIDv4
  text: string;
  required: boolean;
  hint?: string;
}

// -------------------------------------------------------------------------
// Polymorphic Block Definitions
// -------------------------------------------------------------------------

export interface BaseBlock {
  id: string;                 // UUIDv4
  type: BlockType;
}

export interface ParagraphBlock extends BaseBlock {
  type: "paragraph";
  content: string;            // Markdown or sanitized inline HTML
}

export interface HeadingBlock extends BaseBlock {
  type: "heading";
  level: 1 | 2 | 3;
  text: string;
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  mediaId?: string;           // Points to internal asset
  url?: string;               // External web fallback
  altText: string;
  caption?: string;
  aspectRatio?: string;
}

export interface CodeBlock extends BaseBlock {
  type: "code";
  language: string;           // e.g., "bash", "python", "cpp", "json"
  code: string;
  caption?: string;
  showLineNumbers: boolean;
}

export interface VideoBlock extends BaseBlock {
  type: "video";
  url: string;                // YouTube, Vimeo, or local video blob
  caption?: string;
  title?: string;
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

export type ContentBlock =
  | ParagraphBlock
  | HeadingBlock
  | ImageBlock
  | CodeBlock
  | VideoBlock
  | CalloutBlock
  | ChecklistBlock
  | TableBlock;

// -------------------------------------------------------------------------
// Procedural Steps & Sections
// -------------------------------------------------------------------------

export interface PracticalStep {
  id: string;                 // UUIDv4
  stepNumber: number;         // 1-based sequential integer
  title: string;
  description?: string;
  estimatedMinutes?: number;
  blocks: ContentBlock[];     // Blocks belonging exclusively to this step
}

export interface Section {
  id: string;                 // UUIDv4
  title: string;
  description?: string;
  prerequisites?: string[];
  safetyOverview?: string;
  steps: PracticalStep[];
}

// -------------------------------------------------------------------------
// Root Document Interface
// -------------------------------------------------------------------------

export interface OpenJobsheetDocument {
  id: string;                 // UUIDv4
  schemaVersion: SchemaVersion;
  code?: string;              // Optional course code, e.g. "TKJ-LAN-02"
  title: string;
  description: string;
  targetAudience?: string;    // e.g. "SMK Grade 11 - Computer Systems"
  estimatedDurationMinutes: number;
  author: DocumentAuthor;
  tags: string[];
  settings: DocumentSettings;
  assets?: Record<string, MediaAssetRef>; // Map of mediaId to asset metadata/base64
  sections: Section[];
  createdAt: string;          // ISO-8601 UTC string
  updatedAt: string;          // ISO-8601 UTC string
}
```

---

## 3. Student Progress State Schema (Segregated)

The student's interactive state is persisted separately from the jobsheet definition:

```typescript
export interface StudentProgress {
  documentId: string;         // UUIDv4 matching OpenJobsheetDocument.id
  currentStepId: string;      // Currently active step in Guided View
  completedStepIds: string[]; // List of step UUIDs marked complete
  checkedItemIds: string[];   // List of ChecklistItem UUIDs checked by user
  startedAt: string;          // ISO-8601
  lastActiveAt: string;       // ISO-8601
  completedAt?: string;       // ISO-8601 (populated when all required steps are finished)
}
```

---

## 4. Validation Rules & Constraints

1. **Identifier Standard:** All IDs (`id` on documents, sections, steps, blocks, and checklist items) must be RFC 4122 compliant **UUIDv4** strings.
2. **Schema Versioning:** The `schemaVersion` attribute is mandatory. Parsers must check this field before deserializing.
3. **Sequential Step Numbering:** Within each section, `stepNumber` must begin at 1 and increment continuously without gaps.
4. **Callout Variants:** Only `"info" | "tip" | "warning" | "danger"` are permissible.
5. **Checklist Items:** Each checklist item text must be non-empty and have a unique `id` across the entire document.
6. **Code Blocks:** Must declare a valid language identifier (or `"text"` for plain text).
7. **Immutability of Structural IDs:** Once an ID is assigned to a step or checklist item, it must remain stable through edits to ensure student progress mapping remains intact across revisions.

---

## 5. Comprehensive Example Document (JSON)

Below is an authentic, production-grade example of an OpenJobsheet document for a vocational networking laboratory.

```json
{
  "id": "7b8f9e21-4321-4a11-89bc-998877665544",
  "schemaVersion": "1.0.0",
  "code": "TKJ-NET-01",
  "title": "Crimping and Testing UTP Category 5e/6 Cable with RJ-45 Connectors",
  "description": "Standardized procedure for preparing, stripping, untwisting, arranging according to the T568B standard, crimping RJ-45 modular plugs, and conducting continuity verification using a digital LAN cable tester.",
  "targetAudience": "Vocational High School (SMK) - Grade 10 Network Engineering",
  "estimatedDurationMinutes": 60,
  "author": {
    "name": "Budi Hartono, S.T.",
    "institution": "SMK Negeri 2 Yogyakarta",
    "email": "budi.hartono@smkn2-yogya.sch.id"
  },
  "tags": ["Networking", "Hardware", "Cabling", "T568B", "RJ45"],
  "settings": {
    "allowStudentViewSwitch": true,
    "defaultViewMode": "guided",
    "showEstimatedDuration": true,
    "strictStepProgression": false
  },
  "sections": [
    {
      "id": "a1b2c3d4-0001-4000-8000-111122223333",
      "title": "Phase 1: Workshop Preparation & Safety Standards",
      "description": "Verification of protective equipment, hand tools, and cable material specifications.",
      "prerequisites": [
        "Basic understanding of copper network topologies",
        "Knowledge of ANSI/TIA-568 cabling color standards"
      ],
      "safetyOverview": "Handling wire cutters and stripping blades requires safety goggles and attention to hand positioning.",
      "steps": [
        {
          "id": "e5f6a7b8-0101-4000-8000-aaaaaaaaaaaa",
          "stepNumber": 1,
          "title": "Tool & Material Inventory Inspection",
          "estimatedMinutes": 10,
          "blocks": [
            {
              "id": "b101-0001-4000-8000-000000000001",
              "type": "paragraph",
              "content": "Before beginning, verify that your lab station possesses calibrated hand tools and undamaged consumable stock. Discard any modular plugs with bent internal gold pins."
            },
            {
              "id": "b101-0002-4000-8000-000000000002",
              "type": "checklist",
              "title": "Equipment Verification Checklist",
              "items": [
                {
                  "id": "chk-0001-4000-8000-000000000001",
                  "text": "1x Ratcheting RJ-45 Crimping Tool (with built-in blade)",
                  "required": true
                },
                {
                  "id": "chk-0001-4000-8000-000000000002",
                  "text": "1x Rotary UTP Outer Jacket Stripper",
                  "required": true
                },
                {
                  "id": "chk-0001-4000-8000-000000000003",
                  "text": "2x Unshielded RJ-45 8P8C Cat5e Modular Plugs",
                  "required": true
                },
                {
                  "id": "chk-0001-4000-8000-000000000004",
                  "text": "1x 2-meter length of 4-pair UTP Cat5e solid core cable",
                  "required": true
                },
                {
                  "id": "chk-0001-4000-8000-000000000005",
                  "text": "1x Master/Remote Digital Cable Continuity Tester with fresh 9V battery",
                  "required": true
                }
              ]
            },
            {
              "id": "b101-0003-4000-8000-000000000003",
              "type": "callout",
              "variant": "warning",
              "title": "Equipment Protection Notice",
              "content": "Do not squeeze the ratcheting crimper without a modular plug seated in the die cavity; dry firing can misalign teeth on the metal crimp die."
            }
          ]
        },
        {
          "id": "e5f6a7b8-0102-4000-8000-bbbbbbbbbbbb",
          "stepNumber": 2,
          "title": "Stripping the Outer PVC Jacket",
          "estimatedMinutes": 10,
          "blocks": [
            {
              "id": "b102-0001-4000-8000-000000000001",
              "type": "paragraph",
              "content": "Insert the cable into the circular cutting notch of the jacket stripper approximately 2.5 cm (1 inch) from the end. Rotate the tool 360 degrees once smoothly."
            },
            {
              "id": "b102-0002-4000-8000-000000000002",
              "type": "callout",
              "variant": "danger",
              "title": "Insulation Integrity Alert",
              "content": "Never score or nick the individual colored copper conductors. If a copper conductor's insulation is cut, cut off the entire section and re-strip."
            },
            {
              "id": "b102-0003-4000-8000-000000000003",
              "type": "checklist",
              "title": "Stripping Inspection",
              "items": [
                {
                  "id": "chk-0002-4000-8000-000000000001",
                  "text": "Outer jacket cleanly removed leaving exactly 20mm-25mm exposed pairs",
                  "required": true
                },
                {
                  "id": "chk-0002-4000-8000-000000000002",
                  "text": "Rip cord trimmed flush with jacket edge",
                  "required": false
                },
                {
                  "id": "chk-0002-4000-8000-000000000003",
                  "text": "Inspected all 8 conductors: zero copper exposed prior to connector insertion",
                  "required": true
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "a1b2c3d4-0002-4000-8000-222233334444",
      "title": "Phase 2: Conductor Alignment, Crimping & Testing",
      "description": "Arranging wires according to TIA/EIA-568-B pinout and mechanical termination.",
      "steps": [
        {
          "id": "e5f6a7b8-0201-4000-8000-cccccccccccc",
          "stepNumber": 3,
          "title": "Ordering Conductors to T568B Standard",
          "estimatedMinutes": 15,
          "blocks": [
            {
              "id": "b201-0001-4000-8000-000000000001",
              "type": "paragraph",
              "content": "Untwist the 4 pairs and flatten the wires between thumb and index finger. Align them strictly from left to right with the RJ45 gold contacts facing UP and plastic retention clip facing DOWN."
            },
            {
              "id": "b201-0002-4000-8000-000000000002",
              "type": "code",
              "language": "text",
              "caption": "T568B Pinout Standard (Pins 1 through 8)",
              "showLineNumbers": true,
              "code": "Pin 1: White-Orange\nPin 2: Orange\nPin 3: White-Green\nPin 4: Blue\nPin 5: White-Blue\nPin 6: Green\nPin 7: White-Brown\nPin 8: Brown"
            },
            {
              "id": "b201-0003-4000-8000-000000000003",
              "type": "callout",
              "variant": "tip",
              "title": "Trimming Technique",
              "content": "Cut the aligned wires at a sharp 90-degree angle with wire cutters, leaving roughly 12mm of exposed straight wire so the outer jacket enters the plug past the strain relief wedge."
            },
            {
              "id": "b201-0004-4000-8000-000000000004",
              "type": "checklist",
              "title": "Alignment Quality Gate",
              "items": [
                {
                  "id": "chk-0003-4000-8000-000000000001",
                  "text": "Confirmed Pin 1 is White-Orange and Pin 8 is Brown",
                  "required": true
                },
                {
                  "id": "chk-0003-4000-8000-000000000002",
                  "text": "All 8 wire ends reach the front tip of the RJ-45 plug under the gold pins",
                  "required": true
                },
                {
                  "id": "chk-0003-4000-8000-000000000003",
                  "text": "Outer cable jacket sits inside connector past the retention latch bar",
                  "required": true
                }
              ]
            }
          ]
        },
        {
          "id": "e5f6a7b8-0202-4000-8000-dddddddddddd",
          "stepNumber": 4,
          "title": "Continuity Verification with LAN Cable Tester",
          "estimatedMinutes": 15,
          "blocks": [
            {
              "id": "b202-0001-4000-8000-000000000001",
              "type": "paragraph",
              "content": "Plug both terminated ends of your patch cable into the Master and Remote units of the LAN tester. Turn on the tester to automatic scan mode and observe the sequential LED cycle."
            },
            {
              "id": "b202-0002-4000-8000-000000000002",
              "type": "checklist",
              "title": "Pass/Fail Acceptance Verification",
              "items": [
                {
                  "id": "chk-0004-4000-8000-000000000001",
                  "text": "LED 1 through LED 8 light up sequentially in numerical order on both Master and Remote",
                  "required": true
                },
                {
                  "id": "chk-0004-4000-8000-000000000002",
                  "text": "No LEDs skipped (indicates no open circuit)",
                  "required": true
                },
                {
                  "id": "chk-0004-4000-8000-000000000003",
                  "text": "No miswired pairs (LED sequence does not jump out of order)",
                  "required": true
                },
                {
                  "id": "chk-0004-4000-8000-000000000004",
                  "text": "Instructor initials obtained on physical workshop worksheet",
                  "required": false
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "createdAt": "2026-11-23T07:00:00.000Z",
  "updatedAt": "2026-11-23T07:30:00.000Z"
}
```
