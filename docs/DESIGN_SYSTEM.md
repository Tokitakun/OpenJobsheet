# OpenJobsheet Design System

## Specification: Editorial Technical Workspace
- **Version:** 1.0.0
- **Status:** Canonical Design System Standard
- **Audience:** UI/UX Engineers, Product Designers, Technical Contributors

---

## 1. Design Philosophy

OpenJobsheet embodies the **Editorial Technical Workspace** design direction.

It bridges the tactile clarity of a high-grade technical manual with the ergonomic utility of a modern developer environment. The interface intentionally steers away from generic "AI-generated SaaS" templates, saturated purple gradients, and bloated dashboard widgets.

### Core Principles
1. **Calm & Warm:** Soft, paper-inspired tones replace sterile, eye-straining stark whites and aggressive dark grays.
2. **Editorial Typographic Clarity:** Content hierarchy is driven by disciplined type scales, generous line-heights, and clear typographic rhythm rather than excessive decorative boxes.
3. **Ergonomic Workshop Utility:** Designed for harsh real-world environments: high-contrast laboratory lighting, oily or gloved fingers, smartphone mounts, and split-second scanning.
4. **Purposeful Restraint:** Every border, background tint, and badge serves an instructional purpose (e.g., distinguishing a critical high-voltage warning from a casual troubleshooting tip).
5. **Semantic Integrity:** Components are styled based on their pedagogical meaning, not arbitrary cosmetic whim.

---

## 2. Color System & Design Tokens

### 2.1 Foundational Brand Palette

| Color Name | Hex Code | Purpose / Character |
| :--- | :--- | :--- |
| **Forest Green** | `#183F35` | Primary brand accent; authoritative, organic, disciplined, stable. |
| **Warm Paper** | `#F7F6F2` | Canonical light background; reduces eye fatigue compared to pure `#FFFFFF`. |
| **Ink** | `#242824` | Primary typography; soft deep charcoal-slate with warm undertone. |
| **Soft Border** | `#E8E7E0` | Subtle hairline dividers; mimics high-grade technical parchment lines. |
| **Muted Amber** | `#C58A48` | Warm highlight; handles warnings, cautions, and time-sensitive alerts. |
| **Soft Sage** | `#E6EEE9` | Calming background wash for secondary cards, badges, and positive alerts. |

### 2.2 Semantic Color Tokens (Light & Dark Mode)

All interface elements must reference semantic design tokens rather than raw hex values.

| Semantic Token | Light Mode Value | Dark Mode Value | Usage Context |
| :--- | :--- | :--- | :--- |
| `--color-bg-canvas` | `#F7F6F2` (Warm Paper) | `#171C19` (Deep Slate Forest) | Primary page background |
| `--color-bg-surface` | `#FFFFFF` (Pure Crisp) | `#222A25` (Subtle Dark Pine) | Main content cards, editor canvas |
| `--color-bg-elevated` | `#F1F0EA` (Layered Paper) | `#2C3630` (Elevated Charcoal Pine)| Toolbars, floating popovers, menus |
| `--color-bg-muted` | `#EFEFEA` (Subtle Wash) | `#1E2521` (Recessed Base) | Code block background, table headers |
| `--color-text-primary` | `#242824` (Ink) | `#F1F2ED` (Crisp Off-White) | Headings, primary body text |
| `--color-text-secondary`| `#5A625B` (Weathered Slate) | `#A7B3AA` (Muted Sage Gray) | Subtext, timestamps, captions, metadata |
| `--color-text-muted` | `#828C84` (Faded Ink) | `#748278` (Subtle Slate) | Placeholders, keyboard shortcuts |
| `--color-border-subtle` | `#E8E7E0` (Soft Border) | `#2E3A33` (Slate Border) | Structural divider lines, block borders |
| `--color-border-strong` | `#D3D1C7` (Defined Border)| `#415147` (Bright Border) | Focused input borders, active steps |
| `--color-primary` | `#183F35` (Forest Green) | `#A2C0AE` (Sage Mint) | Primary action buttons, active tabs |
| `--color-primary-hover` | `#122F27` (Deep Forest) | `#B4D1C0` (Bright Mint) | Hover state for primary interactions |
| `--color-primary-fg` | `#FFFFFF` | `#14241B` | Text/icon placed on primary color |
| `--color-focus-ring` | `#183F35` (35% opacity) | `#A2C0AE` (45% opacity) | 2px accessible focus outline |
| `--color-success` | `#2D6A4F` | `#74C69D` | Step completed, valid input, passed test |
| `--color-success-bg` | `#EBF5EE` | `#1B2B22` | Success banner background wash |
| `--color-warning` | `#C58A48` (Muted Amber) | `#E2A968` | Caution callouts, attention required |
| `--color-warning-bg` | `#FAF3EB` | `#2D2318` | Warning callout background wash |
| `--color-danger` | `#A63A3A` (Crimson Earth) | `#E57373` | Safety hazards, electrical warnings |
| `--color-danger-bg` | `#F9EBEB` | `#331B1B` | Hazard callout background wash |
| `--color-info` | `#2F6690` (Steel Blue) | `#79B5E0` | Informational tips, documentation hints |
| `--color-info-bg` | `#EEF5FA` | `#182833` | Information callout background wash |

---

## 3. Typography System

The typography pairs an editorial human-centered sans-serif for reading and instructions with an engineered monospace for technical rigor.

- **Primary Typeface:** `DM Sans`, sans-serif (Headings, Body, Controls, Navigation).
- **Technical Typeface:** `IBM Plex Mono`, monospace (Code blocks, terminal commands, hotkeys, pin numbers, parameters).

```css
:root {
  --font-sans: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
```

### 3.1 Typographic Scale & Hierarchy

| Role | Font Family | Size (rem / px) | Weight | Line Height | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Document Title (H1)** | DM Sans | `2.25rem` / 36px | 700 (Bold) | 1.2 (2.7rem) | `-0.025em` |
| **Section Heading (H2)** | DM Sans | `1.625rem` / 26px | 600 (SemiBold) | 1.25 (2.0rem) | `-0.02em` |
| **Step / Subheading (H3)**| DM Sans | `1.25rem` / 20px | 600 (SemiBold) | 1.35 (1.7rem) | `-0.01em` |
| **Block Heading (H4)** | DM Sans | `1.0625rem` / 17px | 600 (SemiBold) | 1.4 (1.5rem) | `0em` |
| **Body (Default)** | DM Sans | `1.0rem` / 16px | 400 (Regular) | 1.6 (1.6rem) | `0em` |
| **Body Large (Intro)** | DM Sans | `1.125rem` / 18px | 400 (Regular) | 1.55 (1.75rem)| `0em` |
| **Body Small (Secondary)**| DM Sans | `0.875rem` / 14px | 400 (Regular) | 1.5 (1.3rem) | `+0.01em` |
| **Caption & Labels** | DM Sans | `0.75rem` / 12px | 500 (Medium) | 1.4 (1.05rem)| `+0.02em` |
| **Technical Code** | IBM Plex Mono | `0.875rem` / 14px | 400 / 500 | 1.65 (1.45rem)| `0em` |
| **Inline Code Badge** | IBM Plex Mono | `0.8125rem` / 13px| 500 (Medium) | 1.0 | `0em` |
| **Kbd / Shortcut** | IBM Plex Mono | `0.75rem` / 12px | 600 (SemiBold) | 1.0 | `+0.05em` |

### 3.2 Typographic Formatting Rules
- **Maximum Line Width:** Prose paragraphs must never exceed `68ch` (approximately 680px) to maintain optimal reading rhythm.
- **Hyphenation:** Avoid automated hyphenation on mobile screens.
- **Code Punctuation:** Inline code tags must display with a subtle background (`--color-bg-muted`) and 1px border (`--color-border-subtle`) with `2px 5px` internal padding.

---

## 4. Spacing, Elevation & Layout Grid

### 4.1 4px Spacing Scale

The layout adheres strictly to an 8-point grid with a 4-point micro-adjustment baseline.

| Token | Pixels | Value | Primary Usage Context |
| :--- | :--- | :--- | :--- |
| `--space-1` | 4px | `0.25rem` | Micro padding, icon gaps, inline badge padding |
| `--space-2` | 8px | `0.5rem` | Button internal Y padding, input inner padding, compact gaps |
| `--space-3` | 12px | `0.75rem` | Button internal X padding, list item gaps |
| `--space-4` | 16px | `1.0rem` | Default component internal padding, card padding (mobile) |
| `--space-5` | 20px | `1.25rem` | Section gaps in compact view |
| `--space-6` | 24px | `1.5rem` | Standard card and dialog interior padding |
| `--space-8` | 32px | `2.0rem` | Step separation, major block spacing |
| `--space-10` | 40px | `2.5rem` | Section dividers, editor canvas top margin |
| `--space-12` | 48px | `3.0rem` | Major content phase breaks |
| `--space-16` | 64px | `4.0rem` | Page margins, empty state vertical breathing room |

### 4.2 Border Radii (Disciplined & Restrained)
*Excessive bubbly curvature is prohibited.* Radii must remain crisp and structural:

- `--radius-sm`: `3px` (Badges, tags, inline code blocks, checkboxes).
- `--radius-md`: `6px` (Buttons, form inputs, tooltips, dropdown menus).
- `--radius-lg`: `8px` (Cards, step containers, code block containers, dialog modals).
- `--radius-full`: `9999px` (Pills, circular avatar badges, step indicator numbers).

### 4.3 Elevation & Shadows
Shadows must feel grounded like natural ambient light falling onto matte paper, not diffuse neon glows.

- `--shadow-subtle`: `0 1px 2px 0 rgba(36, 40, 36, 0.05)` (Cards, resting buttons).
- `--shadow-elevated`: `0 4px 12px -2px rgba(36, 40, 36, 0.08), 0 2px 4px -1px rgba(36, 40, 36, 0.04)` (Dropdowns, floating editor bars).
- `--shadow-modal`: `0 16px 32px -4px rgba(36, 40, 36, 0.14), 0 4px 8px -2px rgba(36, 40, 36, 0.06)` (Dialogs, confirmation sheets).
- **Dark Mode Adjustment:** Shadows are supplemented with a 1px border (`--color-border-subtle`) to preserve edge definition against dark backgrounds.

---

## 5. Iconography Standard

OpenJobsheet standardizes exclusively on **Lucide Icons**.

- **Stroke Width:** Uniform `1.75px` (or `2.0px` on small 14px indicators).
- **Sizes:**
  - `14px`: Inline meta icons (clock, user, tags).
  - `18px`: Standard button and input field icons.
  - `22px`: Section headers, primary navigation controls.
  - `28px`: Empty state and large modal header icons.
- **Rule:** Never use colored emojis as functional interface icons. Use semantic Lucide glyphs:
  - Safety Warning: `AlertTriangle`
  - Critical Hazard: `ShieldAlert`
  - Checklist: `CheckSquare` / `Square`
  - Code Block: `Code2`
  - Time: `Clock`
  - Drag Handle: `GripVertical`
  - Document Mode: `FileText`
  - Guided Mode: `ListOrdered`

---

## 6. Component Specifications

### 6.1 Buttons & Interactive Controls

#### Primary Button
- **Background:** `--color-primary`
- **Text:** `--color-primary-fg` (Font weight 500)
- **Padding:** `8px 16px` (`--space-2` `--space-4`)
- **Border Radius:** `--radius-md` (6px)
- **Hover:** `--color-primary-hover` with `150ms ease-out` transition
- **Focus:** 2px ring with 2px offset (`--color-focus-ring`)

#### Secondary / Outline Button
- **Background:** `transparent` (or `--color-bg-surface`)
- **Border:** `1px solid --color-border-strong`
- **Text:** `--color-text-primary`
- **Hover:** Background tint `--color-bg-muted`

#### Ghost Button
- **Background:** `transparent`
- **Text:** `--color-text-secondary`
- **Hover:** `--color-bg-muted`, Text `--color-text-primary`

#### Step Navigation Buttons (Student Guided View)
- Specially scaled for mobile ergonomic touch: Minimum height `48px`, full horizontal width on mobile viewports, high contrast arrow icon (`ArrowLeft`, `ArrowRight`).

### 6.2 Form Inputs & Controls
- **Text Input & Textarea:**
  - Background: `--color-bg-surface`
  - Border: `1px solid --color-border-subtle`
  - Text: `--color-text-primary` (placeholder `--color-text-muted`)
  - Focus State: Border transitions to `--color-primary`, accompanied by 2px focus ring.
  - Padding: `8px 12px`
- **Checkboxes (Interactive Checklist):**
  - Dimensions: `20px x 20px` (scaled to `24px x 24px` on mobile Guided View for easy tapping).
  - Unchecked: 1.5px border (`--color-border-strong`), background `--color-bg-surface`.
  - Checked: Background `--color-success`, border `--color-success`, crisp white checkmark icon.
  - Associated Text: Transitions to `--color-text-secondary` with subtle strike-through upon completion.

### 6.3 Callout Blocks (Pedagogical Notices)
Callout blocks highlight non-negotiable instructions, warnings, or guidance. They feature a solid 3px left border and a tinted background:

| Callout Type | Left Border Color | Background Tint | Icon | Pedagogical Intent |
| :--- | :--- | :--- | :--- | :--- |
| **Danger / Hazard** | `--color-danger` (`#A63A3A`) | `--color-danger-bg` | `ShieldAlert` | High voltage, hot machinery, chemical hazard, irreversible data loss. |
| **Warning / Caution** | `--color-warning` (`#C58A48`) | `--color-warning-bg` | `AlertTriangle`| Equipment damage risks, common student missteps, prerequisite checks. |
| **Pro Tip / Insight** | `--color-primary` (`#183F35`) | `--color-bg-muted` | `Lightbulb` | Productivity tips, keyboard shortcuts, neat wiring advice. |
| **Informational Note**| `--color-info` (`#2F6690`) | `--color-info-bg` | `Info` | Background theory, documentation references, specification notes. |

### 6.4 Code Blocks
- **Header Bar:** Shows language tag (e.g., `bash`, `python`, `cpp`) in `IBM Plex Mono` uppercase 11px, plus a dedicated "Copy Code" button with instant feedback (`Check` icon on copy).
- **Background:** `--color-bg-muted`
- **Typography:** `IBM Plex Mono`, size `13px` / `14px`, line-height `1.65`.
- **Line Numbers:** Optional, displayed in `--color-text-muted` without being selectable.
- **Padding:** `16px` internal padding with horizontal scrolling on overflow.

### 6.5 Interactive Checklist Blocks
- Container with subtle border and rounded corners.
- Items feature high touch-target padding (`10px 12px`).
- Shows total completed count: e.g., `"3 / 5 verified"`.
- If an item is flagged `required: true`, displays a small semantic badge `"Required"`.

### 6.6 Progress Indicators
- **Step Progress Bar:** Slim 4px continuous bar along top edge or header in Student Mode.
  - Track: `--color-border-subtle`
  - Indicator: Smooth CSS width transition using `--color-primary` (`transition: width 200ms ease-out`).
- **Step Counter Badge:** Crisp monospace pill: e.g., `"STEP 03 OF 07"`.

---

## 7. Layout Principles & Workspace Ergonomics

### 7.1 Creator Mode Layout
- **Focus Hierarchy:** The central document editor canvas commands 75% of visual weight.
- **Unobtrusive Toolbars:** Floating contextual formatting bar appears only upon text selection. Block insertion bar sits quietly between blocks.
- **Inspector / Outline Drawer:** Collapsible right-hand sidebar for step reordering, estimated times, and document metadata. Never crowds the editing flow.

### 7.2 Student Mode Layouts (Hybrid View)

#### Document View
- **Max Width:** Centered container with max width `840px`.
- **Sidebar:** Left-aligned sticky Table of Contents (hidden on viewports `< 1024px`, replaced with a sliding drawer).
- **Reading Rhythm:** Consistent 32px gap between steps; 16px gap between blocks.

#### Guided Step-by-Step View
- **Single Focus Container:** Maximum width `720px`, centered.
- **Step Header Card:** Prominently announces Step Number, Step Title, and Estimated Duration.
- **Content Flow:** Safety callouts placed before instructions; step checklist placed directly above navigation.
- **Sticky Footer Action Bar:** Fixed to the bottom of the viewport on mobile devices. Contains large "Previous Step" and "Next Step" buttons and a view switch toggle.

### 7.3 Responsive Breakpoints

| Breakpoint Name | Min Width | Target Devices & Context |
| :--- | :--- | :--- |
| `sm` | 640px | Large smartphones (portrait and landscape) |
| `md` | 768px | Tablets (iPad, Android tablets used in labs) |
| `lg` | 1024px | Small laptops, desktop workshop stations |
| `xl` | 1280px | Standard desktop displays |
| `2xl` | 1536px | Large widescreen lab monitors |

---

## 8. Motion & Micro-Interactions

- **Timing Budget:** All functional transitions must complete between **150ms and 220ms**.
- **Easing:** Standard natural deceleration `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Prohibited:** Bouncy rubber-band spring animations, sliding hero carousels, or animations that delay user input.
- **Accessibility Requirement:** Every animation must respect user operating system settings:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```

---

## 9. Explicit UI Anti-Patterns (What NOT to Do)

To maintain the calm, editorial integrity of OpenJobsheet, contributors must strictly avoid:

1. **NO AI SaaS Purple-Blue Gradients:** Do not use diagonal gradients across backgrounds, buttons, or headers.
2. **NO Excessive Glassmorphism:** Avoid blurry `backdrop-filter: blur(20px)` panels with translucent white borders. Cards must be solid, crisp, and readable.
3. **NO Excessive Rounding:** Avoid 16px–24px bubbly border-radii on standard containers. Keep corners restrained (`3px` to `8px`).
4. **NO "Card Spam":** Do not wrap every single paragraph or heading in its own floating card. Use whitespace and typography to define structure.
5. **NO Emojis as Interface Glyphs:** Do not use ⚠️, 📌, 🚀, or ✅ as system buttons or status icons. Use Lucide SVG icons.
6. **NO Faux Dashboard Metrics:** Do not create fake "Student Engagement", "AI Productivity Scores", or decorative line charts that serve no instructional purpose.
7. **NO Floating Action Buttons (FAB) that Obscure Content:** Never place floating circular buttons that hide the bottom lines of instructions or checklists.
