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
| [0008](0008-construction-grid-from-visible-pixels.md) | Construction grid drawn from the logo's visible pixels | Accepted | 2026-10-15 |
| [0009](0009-skins-drawn-in-svg.md) | Skins drawn in SVG, measured in mm | Accepted | 2026-10-16 |
| [0010](0010-skins-as-a-stack-of-layers.md) | Skins as a stack of layers, reordered with buttons | Accepted | 2026-10-16 |
| [0011](0011-cover-colors-only-paint-the-cover.md) | The Cover's colors only paint the Cover; the Skin owns its colors | Accepted | 2026-10-16 |
| [0012](0012-pdf-pages-drawn-as-images.md) | PDF pages drawn as images, with html-to-image and jsPDF | Accepted | 2026-10-16 |
| [0013](0013-mockups-as-svg-illustrations.md) | Mockups drawn as SVG illustrations from plain data | Proposed | 2026-10-16 |
| [0014](0014-photo-mockups-composed-in-webgl.md) | Photo mockups composed in WebGL, shown as images | Proposed | 2026-10-16 |
| [0015](0015-logo-layers-from-svg.md) | Logo layers read from SVG in the browser | Accepted | 2026-10-20 |
| [0018](0018-optional-stateless-cmyk-server.md) | An optional, stateless server, only for CMYK | Proposed | 2026-10-28 |
| [0019](0019-real-cmyk-with-icc-profile.md) | Real CMYK with an ICC profile, one page per request | Proposed | 2026-10-28 |
