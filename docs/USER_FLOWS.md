# User Flows & Interaction Journeys

## Document Information
- **Product Name:** OpenJobsheet
- **Document Version:** 1.0.0
- **Status:** Approved Behavioral Specification

---

## 1. Overview of Key User Journeys

OpenJobsheet facilitates distinct workflows across two primary user groups:
1. **Instructors / Creators:** Preparing, organizing, previewing, and distributing worksheets.
2. **Students / Practical Learners:** Reading instructions, navigating steps, verifying tasks, and tracking lab completion.

---

## 2. Creator Journeys

### 2.1 Journey 1: First-Time Visitor & Template Discovery

```mermaid
flowchart TD
    Start["Land on OpenJobsheet Home"] --> CheckDB{"Existing Local Jobsheets?"}
    CheckDB -->|"No (First Visit)"| Welcome["Display Calm Welcome & Starter Templates"]
    CheckDB -->|"Yes"| Library["Display Local Jobsheet Library"]
    
    Welcome --> ChoosePath{"User Action"}
    ChoosePath -->|"Select Starter Template"| CloneTpl["Clone Template to Local IndexedDB"]
    ChoosePath -->|"Create Blank"| BlankDoc["Initialize Blank Document AST"]
    ChoosePath -->|"Import Existing JSON"| ImportFlow["Trigger JSON Import Flow"]
    
    CloneTpl --> Editor["Open Creator Canvas (Editor)"]
    BlankDoc --> Editor
```

- **User Story:** As an instructor opening OpenJobsheet for the first time, I want to explore high-quality sample templates or immediately start a blank jobsheet without registering an account.
- **Key Interactions:**
  - Landing screen displays 3 default templates (Networking Lab, Electronics Wiring, Software Deployment).
  - Clicking "Use Template" clones the template into the browser's IndexedDB with a unique UUID.
  - URL routes to `/editor/[id]` with immediate auto-save active.

---

### 2.2 Journey 2: Authoring a Jobsheet & Managing Steps

```mermaid
flowchart TD
    InEditor["In Creator Mode Canvas"] --> AddMeta["Edit Title, Course Code & Estimated Time"]
    AddMeta --> AddStep["Click 'Add Practical Step'"]
    AddStep --> SetStepTitle["Enter Step Title & Step Duration"]
    SetStepTitle --> InsertBlock{"Select Block Type"}
    
    InsertBlock -->|"Paragraph"| WriteText["Write Instructional Text (Markdown shortcuts)"]
    InsertBlock -->|"Screenshot / Image"| PasteImage["Paste Clipboard Image or Drop File"]
    InsertBlock -->|"Code Snippet"| InputCode["Select Language & Paste Code"]
    InsertBlock -->|"Safety Callout"| SelectCallout["Choose Danger/Warning & Enter Hazard Text"]
    InsertBlock -->|"Checklist"| AddChecks["Define Verification Tasks (Required/Optional)"]
    
    WriteText --> Reorder{"Reorder Needed?"}
    PasteImage --> Reorder
    InputCode --> Reorder
    SelectCallout --> Reorder
    AddChecks --> Reorder
    
    Reorder -->|"Yes"| DragBlock["Drag Handle to Reorder Block or Step"]
    Reorder -->|"No"| AutoSave["Auto-Save to IndexedDB (500ms debounce)"]
```

- **User Story:** As an instructor, I want to write lab procedures using structured blocks and safety callouts so students can follow them without ambiguity.
- **Key Interactions:**
  - Pressing `/` or clicking the block inserter displays available content blocks.
  - Dragging a block reorders it within the step.
  - Dragging a step card in the sidebar outline reorders entire practical steps, automatically updating step numbers.

---

### 2.3 Journey 3: Adding Media & Code References

```mermaid
sequenceDiagram
    autonumber
    actor Instructor
    participant UI as Editor Canvas
    participant Pipeline as Image Pipeline
    participant DB as IndexedDB (Dexie)

    Instructor->>UI: Paste screenshot from clipboard (Ctrl+V)
    UI->>Pipeline: Intercept Paste Event (File Blob)
    Pipeline->>Pipeline: Validate MIME type & file size (<10MB)
    Pipeline->>Pipeline: Compress/Resize to WebP (max 1920px)
    Pipeline->>DB: Store blob in media_assets table
    DB-->>Pipeline: Return generated mediaId (UUID)
    Pipeline->>UI: Insert ImageBlock { mediaId, altText, caption }
    UI->>DB: Auto-save updated document AST
    UI-->>Instructor: Render crisp image preview with editable caption field
```

- **User Story:** As an instructor, I want to paste terminal output screenshots directly from my clipboard so I don't have to manually save and upload image files.
- **Key Interactions:**
  - Pasting an image automatically triggers client-side WebP compression.
  - The image immediately renders inline with a caption placeholder.
  - A small pill displays compressed file size (e.g., `142 KB WebP`).

---

### 2.4 Journey 4: Previewing the Student Experience

```mermaid
flowchart LR
    Editor["In Creator Mode (/editor/id)"] --> ClickPreview["Click 'Preview' Button (Top Bar)"]
    ClickPreview --> ModalToggle{"Preview Mode"}
    ModalToggle -->|"Preview Document View"| RenderDoc["Render Full Document Layout"]
    ModalToggle -->|"Preview Guided View"| RenderGuide["Render Step-by-Step Stepper"]
    RenderDoc --> Switch["Test View Toggle"]
    RenderGuide --> Switch
    Switch --> ExitPreview["Click 'Back to Editor'"]
    ExitPreview --> Editor
```

- **User Story:** As an instructor, I want to test how my jobsheet looks and behaves on mobile and desktop before sharing it with students.
- **Key Interactions:**
  - One-click transition into Student Mode with a persistent banner: *"Preview Mode — Changes here are read-only"*.
  - Instructors can test checking boxes and moving through steps without permanently saving student progress.

---

## 3. Student Journeys (Hybrid Execution)

### 3.1 Journey 5: Student Opening a Jobsheet

```mermaid
flowchart TD
    OpenDoc["Student opens Jobsheet URL or imports JSON"] --> LoadDB["Load Document AST from IndexedDB"]
    LoadDB --> CheckProgress{"Existing Progress Found?"}
    
    CheckProgress -->|"Yes"| ResumeState["Restore Checked Items & Last Active Step"]
    CheckProgress -->|"No"| InitState["Initialize Blank Progress Record"]
    
    ResumeState --> CheckDefaultView{"Default View Mode Setting"}
    InitState --> CheckDefaultView
    
    CheckDefaultView -->|"guided (Default)"| GuidedView["Open Guided Step-by-Step View"]
    CheckDefaultView -->|"document"| DocView["Open Full Document View"]
```

---

### 3.2 Journey 6: Guided Step-by-Step Execution

```mermaid
flowchart TD
    StepView["Active in Guided View (Step N)"] --> ReadSafety["Review Safety Callout & Tools Required"]
    ReadSafety --> Perform["Perform Practical Lab Task"]
    Perform --> CheckItem["Tap Checklist Item Checkbox"]
    CheckItem --> UpdateProgress["Save Checked ID to student_progress Table"]
    UpdateProgress --> CalcPercent["Update Step & Document Progress Bar"]
    
    CalcPercent --> StepDone{"All Required Tasks Checked?"}
    StepDone -->|"Yes"| EnableNext["Highlight 'Next Step' Primary Button"]
    StepDone -->|"No"| CanProceed{"Strict Progression Active?"}
    
    CanProceed -->|"No"| EnableNext
    CanProceed -->|"Yes"| AlertGate["Prompt: Complete required items to advance"]
    
    EnableNext --> ClickNext["Tap 'Next Step' Button"]
    ClickNext --> NextStep["Advance to Step N+1"]
```

- **User Story:** As a student standing at a workshop bench with tools in hand, I want to see only the instructions and safety alerts for my current step, with large buttons to navigate when done.
- **Key Interactions:**
  - Tapping a checklist item instantly plays a subtle visual check animation and updates the progress indicator.
  - Screen wake-lock keeps the display illuminated while the student works with physical tools.
  - Bottom navigation bar is thumb-accessible on mobile devices.

---

### 3.3 Journey 7: Switching Views with State Preservation

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant Stepper as Guided View (Step 3)
    participant Store as State Synchronization Engine
    participant Doc as Document View

    Student->>Stepper: Tap "Switch to Document View" toggle
    Stepper->>Store: Dispatch View Mode Change { activeStepId: "step-03" }
    Store->>Doc: Mount Document View with activeStepId
    Doc->>Doc: Query student_progress for checkedItemIds
    Doc->>Doc: Render all steps with matching checked states
    Doc->>Doc: Execute smooth scroll to #step-03 element
    Doc-->>Student: Display full document centered on Step 3
    
    Note over Student,Doc: Student reads surrounding context or previous steps
    
    Student->>Doc: Tap checklist item in Step 2
    Doc->>Store: Update checkedItemIds in IndexedDB
    Student->>Doc: Tap "Switch to Guided View" toggle
    Store->>Stepper: Mount Guided View with activeStepId: "step-02"
    Stepper-->>Student: Display Guided View at Step 2 with new checklist state
```

- **User Story:** As a student in Guided View who wants to double-check an earlier wiring diagram, I want to switch to Document View without losing my current step or checked items.
- **Key Requirements:**
  - View toggling is instant (zero network roundtrips).
  - Scroll position accurately anchors to the active step.
  - Checklist states remain perfectly synchronized across both views.

---

## 4. Portability & Distribution Journeys

### 4.1 Journey 8: Exporting & Distributing a Jobsheet

```mermaid
flowchart TD
    Instructor["In Creator Mode or Library"] --> ClickExport["Click 'Export Jobsheet'"]
    ClickExport --> ChooseFormat{"Select Export Option"}
    
    ChooseFormat -->|"Standalone JSON (.json)"| BundleAssets["Encode Referenced Media Blobs to Base64"]
    BundleAssets --> ValidateJSON["Validate against Zod Schema v1.0.0"]
    ValidateJSON --> DownloadFile["Browser triggers file download: [code]-[title].json"]
    
    ChooseFormat -->|"Print / Save to PDF"| TriggerPrint["Inject Print CSS Stylesheet"]
    TriggerPrint --> BrowserDialog["Open Native Browser Print Dialog (Save as PDF)"]
    
    DownloadFile --> Distribute["Share via USB, WhatsApp, Google Drive, or Local Server"]
```

---

### 4.2 Journey 9: Importing a Jobsheet

```mermaid
flowchart TD
    User["Open OpenJobsheet on another machine/browser"] --> ClickImport["Click 'Import Jobsheet (.json)'"]
    ClickImport --> PickFile["Select .json file from local disk"]
    PickFile --> ParseJSON["Parse JSON String"]
    
    ParseJSON --> Validate{"Zod Schema Validation"}
    Validate -->|"Fails"| ShowError["Display Error Modal with Specific Line/Attribute"]
    Validate -->|"Succeeds"| CheckCollision{"Document ID already exists locally?"}
    
    CheckCollision -->|"Yes"| ConflictDialog{"Prompt User: Overwrite or Duplicate?"}
    ConflictDialog -->|"Duplicate"| GenerateNewID["Generate New UUIDv4 for Document"]
    ConflictDialog -->|"Overwrite"| ReplaceRecord["Replace Existing Local Record"]
    CheckCollision -->|"No"| WriteDB["Write Document AST to IndexedDB"]
    
    GenerateNewID --> ExtractBlobs["Extract Embedded Base64 Media to media_assets"]
    ReplaceRecord --> ExtractBlobs
    WriteDB --> ExtractBlobs
    
    ExtractBlobs --> OpenView["Open Imported Jobsheet in Library"]
```
