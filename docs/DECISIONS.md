# Architectural Decision Records (ADRs)

## Document Information
- **Product Name:** OpenJobsheet
- **Document Version:** 1.0.0
- **Status:** Approved Baseline Decisions

---

## Index of Decisions

- [ADR-001: Local-First Architecture with IndexedDB as Primary Storage](#adr-001-local-first-architecture-with-indexeddb-as-primary-storage)
- [ADR-002: Unified JSON Document Schema (AST) for Creator and Student Modes](#adr-002-unified-json-document-schema-ast-for-creator-and-student-modes)
- [ADR-003: Hybrid Dual-View Student Mode (Document View + Guided View)](#adr-003-hybrid-dual-view-student-mode-document-view--guided-view)
- [ADR-004: Client-Side Media Storage via IndexedDB Blobs / OPFS](#adr-004-client-side-media-storage-via-indexeddb-blobs--opfs)
- [ADR-005: Decoupled Editor AST from View Renderers](#adr-005-decoupled-editor-ast-from-view-renderers)
- [ADR-006: Deferring Cloud Sync & Authentication to Post-MVP (Supabase Candidate)](#adr-006-deferring-cloud-sync--authentication-to-post-mvp-supabase-candidate)
- [ADR-007: Editorial Technical Workspace Visual Identity & Design System](#adr-007-editorial-technical-workspace-visual-identity--design-system)
- [ADR-008: Open-Source Distribution under MIT License](#adr-008-open-source-distribution-under-mit-license)

---

## ADR-001: Local-First Architecture with IndexedDB as Primary Storage

### Status
**Accepted**

### Context
Vocational schools (SMK), rural training centers, and engineering workshops often experience intermittent or non-existent internet connectivity. Traditional web applications that mandate cloud authentication and server-side databases fail completely in these educational settings. Additionally, requiring students to register accounts or log in creates severe operational friction at the beginning of a 45-minute lab session.

### Decision
OpenJobsheet is built as a **local-first web application**. Browser IndexedDB (managed via `Dexie.js`) serves as the primary persistence layer for all documents, media assets, and student task progress records. No user registration, network handshake, or cloud server is required to create, edit, view, or complete jobsheets.

### Reasoning
- **Immediate Zero-Friction Utility:** An instructor or student can open the application and immediately begin authoring or executing practicals.
- **Offline Resilience:** Physical computer labs, workshops, and mobile devices function seamlessly without Wi-Fi connectivity.
- **User Privacy & Ownership:** Student work and instructor documents remain on their personal hardware by default.

### Trade-offs & Consequences
- **Positive:** Maximum reliability, lightning-fast instant reads/writes, zero operational server hosting costs for the community.
- **Negative:** Data is tied to the specific browser instance unless explicitly exported as a JSON file. Browser storage clearing or private browsing modes require user awareness and proactive storage persistence requests (`navigator.storage.persist()`).

---

## ADR-002: Unified JSON Document Schema (AST) for Creator and Student Modes

### Status
**Accepted**

### Context
Applications that support rich authoring and separate reading interfaces often drift into maintaining disparate data representations (e.g., HTML strings for reading, proprietary block state for editing). This divergence causes formatting bugs, sync errors, and difficult export handling.

### Decision
OpenJobsheet standardizes on a **single canonical Abstract Syntax Tree (AST)** represented as a versioned JSON document (`openjobsheet-document-schema` v1.0.0). Both Creator Mode (the block-based editor) and Student Mode (both Document View and Guided View) consume and render this exact data structure.

### Reasoning
- **Data Integrity:** Eliminates rendering discrepancies between what an instructor previews and what a student sees.
- **Portability:** Serializing a jobsheet for file export simply requires converting the in-memory AST to a formatted JSON string.
- **Strict Validation:** Runtime validation via Zod guarantees structural validity upon import and prevents corrupted state from crashing the application.

### Trade-offs & Consequences
- **Positive:** Predictable data pipeline, seamless roundtrip file export/import, clean schema migration path.
- **Negative:** Requires creating custom block rendering components rather than relying on off-the-shelf monolithic rich-text editors.

---

## ADR-003: Hybrid Dual-View Student Mode (Document View + Guided View)

### Status
**Accepted**

### Context
Practical learning requires two conflicting reading behaviors:
1. **Holistic Contextual Reading:** Scanning the full document to understand overall objectives, required tools, safety overviews, and structural prerequisites (best served by a long-form document view).
2. **Focused Tactical Execution:** Performing physical steps one at a time at a workshop bench with tools in hand, where long-form documents cause cognitive overload and scrolling fatigue (best served by a single-step guided view).

### Decision
OpenJobsheet implements a **Hybrid Dual-View Student Mode**. Students can toggle dynamically between **Document View** (full technical documentation layout) and **Guided View** (single-step focused stepper). State (checklist items checked, current step anchor) is synchronized continuously between both views.

### Reasoning
- Matches pedagogical reality: students read the document overview before class, switch to Guided View during bench execution, and toggle back to Document View to cross-reference earlier wiring schematics or troubleshooting appendices.
- Preserving completion state and scroll location prevents disorientation during view switches.

### Trade-offs & Consequences
- **Positive:** Unrivaled educational ergonomics and usability across mobile devices and desktop stations.
- **Negative:** Requires rigorous state management to guarantee that switching views never resets the student's place or unchecked items.

---

## ADR-004: Client-Side Media Storage via IndexedDB Blobs / OPFS

### Status
**Accepted**

### Context
Technical jobsheets rely heavily on visual aids: screenshots of software settings, terminal output captures, circuit diagrams, and photos of physical machinery. Storing these assets requires balancing local storage capacity, performance, and export portability.

### Decision
All user-provided media assets are converted to optimized WebP format on the client, assigned a UUIDv4, and stored as binary Blobs in a dedicated `media_assets` table in IndexedDB (with future migration to Origin Private File System / OPFS). When exported as a standalone JSON file, assets are encoded as base64 data strings within the document manifest.

### Reasoning
- Prevents IndexedDB document records from bloating by decoupling raw binary media from the document AST.
- Client-side image compression keeps file footprints small (<250 KB per image) while preserving legibility.
- Allows fully offline image persistence without a cloud asset server.

### Trade-offs & Consequences
- **Positive:** Works offline, prevents external image link rot, supports drag-and-drop and clipboard paste.
- **Negative:** Bundled standalone JSON export files with many images can grow in size (5MB–20MB).

---

## ADR-005: Decoupled Editor AST from View Renderers

### Status
**Accepted**

### Context
Tying an application's document format directly to a specific third-party rich-text editor framework (e.g., ProseMirror, Slate, Draft.js, Quill) creates severe long-term maintenance liabilities and makes headless rendering outside that editor difficult.

### Decision
The document schema and domain models remain strictly decoupled from any editor framework. The editor operates on a pure TypeScript AST. We map UI input events into discrete AST operations (Add Block, Move Step, Update Content), while read-only student views simply map AST blocks to functional React presentation components.

### Reasoning
- Eliminates heavy third-party framework dependencies from the student reading bundle.
- Protects the project from breaking changes or abandonment of external editor libraries.
- Facilitates future alternate renderers (e.g., CLI tools, static site generators, print formatters).

### Trade-offs & Consequences
- **Positive:** Ultra-lightweight student viewer bundle (<250 KB), zero runtime vendor lock-in.
- **Negative:** Requires implementing our own block insertion, deletion, and reordering logic.

---

## ADR-006: Deferring Cloud Sync & Authentication to Post-MVP (Supabase Candidate)

### Status
**Accepted**

### Context
A common failure mode for open-source educational software is attempting to build complex user authentication, multi-tenant databases, billing, and cloud sync before the core product experience is proven and ergonomic.

### Decision
Cloud functionality, user authentication, and multi-device synchronization are **explicitly deferred to post-MVP development (Phase 6+)**. When cloud capabilities are introduced, **Supabase** (PostgreSQL, Supabase Auth, Row-Level Security, Supabase Storage) is the designated candidate platform.

### Reasoning
- Focuses 100% of initial development bandwidth on perfecting the authoring experience, student ergonomics, and local-first reliability.
- Prevents premature infrastructure hosting costs and security compliance overhead.
- Ensuring the local-first engine is completely standalone guarantees that cloud features remain strictly optional extensions rather than mandatory prerequisites.

### Trade-offs & Consequences
- **Positive:** Accelerated delivery of a robust, production-quality local tool.
- **Negative:** Initial users must manually export/import JSON files to transfer documents between devices.

---

## ADR-007: Editorial Technical Workspace Visual Identity & Design System

### Status
**Accepted**

### Context
Many open-source tools adopt generic UI frameworks resulting in sterile, unpolished, or uninviting interfaces. Conversely, modern commercial SaaS tools often default to generic AI aesthetic clichés: saturated purple-blue gradients, excessive glassmorphic blur, and bubbly rounded containers that feel unprofessional in technical vocational settings.

### Decision
OpenJobsheet adopts the **Editorial Technical Workspace** design direction. The visual identity pairs warm, paper-inspired tones (`#F7F6F2`, `#183F35`, `#242824`) with disciplined typography (`DM Sans` for prose and `IBM Plex Mono` for technical labels) and restrained structural radii (`3px` to `8px`).

### Reasoning
- Fosters a calm, focused, and scholarly environment suitable for both instructors and learners.
- High contrast and disciplined spacing maximize legibility in challenging physical workshop environments.
- Distinguishes OpenJobsheet as a mature, handcrafted professional tool rather than a generic template.

### Trade-offs & Consequences
- **Positive:** Distinctive brand presence, exceptional reading comfort, strict accessibility compliance (WCAG AA).
- **Negative:** Requires contributors to strictly follow custom design tokens rather than dropping in unstyled third-party component libraries.

---

## ADR-008: Open-Source Distribution under MIT License

### Status
**Accepted**

### Context
To achieve widespread adoption across public vocational high schools, community polytechnics, and educational initiatives globally, the project requires a permissive, internationally recognized legal framework.

### Decision
OpenJobsheet is released under the **MIT License**. All documentation, schema specifications, and future application source code remain permanently open-source.

### Reasoning
- Allows public schools and non-profit institutions to deploy, adapt, and localize the software without licensing barriers.
- Encourages contributions from international educators and developer communities.
- Provides maximum flexibility for educational institutions to bundle or host the tool on intranet servers.

### Trade-offs & Consequences
- **Positive:** Unrestricted community adoption, clear intellectual property terms.
- **Negative:** Permissive terms allow third-party proprietary forks, which we mitigate by building a strong upstream community.
