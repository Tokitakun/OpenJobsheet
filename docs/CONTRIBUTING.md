# Contributing to OpenJobsheet

Thank you for your interest in contributing to OpenJobsheet! This document establishes the contribution policies, engineering standards, and community guidelines for the project.

> [!NOTE]
> OpenJobsheet is currently in its initial architecture and specification phase. The guidelines below define our standard conventions for all upcoming Phase 1–5 development. Automated CI and bot workflows will be activated alongside the codebase bootstrap.

---

## 1. Contribution Philosophy

OpenJobsheet exists to provide educators and students with a calm, reliable, distraction-free tool for practical technical learning. Every contribution should uphold these core tenets:

1. **Practical Utility Over Novelty:** Prioritize features that solve real problems in messy workshops, computer labs, and technical classrooms over superficial tech trends.
2. **Local-First Integrity:** Never compromise the offline usability of the application. The tool must function completely without network access.
3. **Design System Discipline:** We adhere strictly to the **Editorial Technical Workspace** design guidelines. Do not submit generic SaaS components, excessive gradients, or unauthorized icons.
4. **Clean, Documented Code:** We value readable, well-commented, and strongly-typed code over clever obfuscation.

---

## 2. Branching Strategy

Our repository uses a trunk-based branching workflow. All development takes place in feature or fix branches branched from `main`.

| Branch Pattern | Purpose | Example |
| :--- | :--- | :--- |
| `main` | Production-ready, stable codebase | `main` |
| `feat/<issue-id>-<slug>` | New user-facing feature or enhancement | `feat/12-block-drag-drop` |
| `fix/<issue-id>-<slug>` | Bug fix or patch | `fix/45-safari-blob-rendering` |
| `docs/<slug>` | Documentation creation or updates | `docs/update-schema-specs` |
| `refactor/<slug>` | Code reorganization without functional changes | `refactor/dexie-storage-adapter` |

---

## 3. Commit Message Conventions

We adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification. This convention enables automated changelog generation and maintains a clean git history.

### Format
```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### Commit Types
- `feat`: A new user-facing capability or block type.
- `fix`: A bug fix in existing behavior.
- `docs`: Documentation changes only (Markdown files).
- `style`: Changes that do not affect code logic (formatting, whitespace, semi-colons).
- `refactor`: Code changes that neither fix bugs nor add features.
- `perf`: A code change that improves performance or bundle size.
- `test`: Adding missing tests or correcting existing tests.
- `chore`: Build process, dependency updates, or auxiliary tool maintenance.

### Examples
- `feat(editor): implement image paste handler with client-side WebP compression`
- `fix(student): preserve active step scroll position when toggling hybrid view`
- `docs(schema): document new video embed block interface in v1.0.0`
- `test(storage): add unit tests for corrupted IndexedDB document recovery`

---

## 4. Pull Request (PR) Guidelines

When you are ready to submit your contribution, please follow this checklist:

### PR Preparation Checklist
1. **Branch Freshness:** Ensure your branch is rebased on the latest `main`.
2. **Type Check:** Run TypeScript compilation to ensure zero compiler errors (`pnpm typecheck` or equivalent).
3. **Linting & Formatting:** Ensure code adheres to ESLint and Prettier rules without disabling warnings.
4. **Test Coverage:** Add unit tests for any new business logic, schema modifications, or storage adapters.
5. **Documentation:** Update relevant documents in `docs/` if your change introduces new block types, modifies schema attributes, or changes UI design tokens.

### PR Description Template
Your pull request description should clearly explain:
- **What:** A concise summary of the changes made.
- **Why:** The problem being solved or feature being introduced (link relevant Issue).
- **How:** Technical overview of the implementation approach.
- **Visual Evidence:** Screenshots or short screen recordings (especially for UI or Design System changes).
- **Manual Testing Steps:** Step-by-step instructions for reviewers to verify the behavior locally.

---

## 5. Code Quality & Style Expectations

### 5.1 TypeScript Strictness
- Strict mode is enforced across the entire repository.
- Avoid the `any` type. Use explicit interfaces, generics, or `unknown` with runtime type narrowing.
- Use Zod schemas in `src/core/schema` as the single source of truth for runtime validation.

### 5.2 Styling & Design Tokens
- Style components exclusively using Tailwind utility classes referencing our semantic design tokens defined in `docs/DESIGN_SYSTEM.md`.
- Never use hardcoded arbitrary hex color values (e.g., `bg-[#183F35]`). Use the semantic token class (e.g., `bg-primary` or `bg-canvas`).
- Adhere strictly to the anti-pattern prohibitions (no AI SaaS gradients, no floating card spam, no emoji icons).

### 5.3 Icon Usage
- Import icons exclusively from `lucide-react`.
- Maintain a consistent stroke width of `1.75px` across all controls.

---

## 6. Issue Reporting Guidelines

### Reporting Bugs
Before filing an issue, please verify that the bug has not already been reported in the issue tracker.

When opening a bug report, include:
- A descriptive title summarizing the defect.
- Clear, numbered reproduction steps.
- Expected behavior vs. actual behavior.
- Environment details: Operating System, Browser engine and version, Device type (Desktop, Mobile, Tablet).
- Relevant console error logs or screenshots.

### Requesting Features
We welcome proposals that align with our product vision for practical technical education.

When opening a feature proposal, address:
- The target user persona (SMK teacher, vocational student, lab trainer).
- The practical problem in the workshop or lab this feature addresses.
- Proposed user interaction or design.
- How the feature maintains local-first offline reliability.
