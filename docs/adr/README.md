# Architecture Decision Records

An **ADR** (Architecture Decision Record) is a short document that records **one** important technical decision: what was decided, why, and what follows from it. Specs in `specs/` describe **what** a feature does; ADRs explain **why** the project is built the way it is.

## Rules
* **One decision per file**, numbered in order: `0001-short-title.md`, `0002-...`.
* **Never rewrite an accepted ADR.** If a decision changes, write a new ADR and set the old one's status to `Superseded by ADR 00XX`.
* **Keep it short**: one page at most.
* Status is one of: `Proposed`, `Accepted`, `Rejected`, `Deprecated`, `Superseded by ADR 00XX`.
* To add one, copy [template.md](template.md), use the next number and add a row to the index below.

## Index
| # | Decision | Status | Date |
|---|----------|--------|------|
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted | 2026-10-11 |
| [0002](0002-frontend-only-no-persistence.md) | Frontend only, no persistence | Accepted | 2026-10-11 |
| [0003](0003-approximate-cmyk-rgb-pdf.md) | Approximate CMYK, print PDF stays in RGB | Accepted | 2026-10-11 |
| [0004](0004-templates-change-layout-not-content.md) | Templates change layout, not content | Accepted | 2026-10-11 |
| [0005](0005-google-fonts-via-css-api.md) | Load Google Fonts through the CSS API | Accepted | 2026-10-11 |
| [0006](0006-motion-with-css-and-view-transitions.md) | Motion with CSS and native browser APIs, no animation library | Accepted | 2026-10-11 |
| [0007](0007-live-preview-with-apply-for-images.md) | Live preview, with one Apply button for new images | Accepted | 2026-10-14 |
