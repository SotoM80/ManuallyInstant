# ADR 0022: Image boxes styled by the Skin, through CSS variables

## Status
Proposed — 2026-10-29

## Context
The boxes that hold the logo's images on the inner pages (Anatomy cards and parts, Logo versions, the construction grid of Clear space, Usage examples) all share one rule, `.logo-figure` in `src/templates/shared.css`: 4 px corners, the image 8 % in from each side, and a 1 px outline in the page text color at 15 %. No template changes it (ADR 0004 keeps templates to layout). A brand has its own look: square or round corners, more or less air around the logo, a frame or none. It should be set once and hold on every page, so the manual stays consistent.

Options considered:
* **Per image**: each box with its own corners, margin and outline. Many more fields, and a manual whose boxes do not match.
* **Per template**: a template would change content style, not only layout (against ADR 0004).
* **Once, in the Skin**: the Skin already owns how the inner pages look (ADR 0011). One group of settings, applied to every box.

Units: the preview pages are not a scaled copy of the A4 page (the Overview view uses `zoom: 0.5`, and the text has fixed sizes per view), and the Clear space diagram is a nested size container. Sizes in mm of the page would change how the Grid and Overview views look and need container units across nested containers.

## Decision
We will add an **Image boxes** group to the Skin: **Corner radius** (0–24 px), **Inner margin** (0–20 %) and **Outline** (on or off, 1–4 px). `ManualPage` sets them as CSS variables on each inner page (`--box-radius`, `--box-margin`, `--box-outline`), and `shared.css` reads them in `.logo-figure`, with fallbacks equal to today's values. They are in **px**, like the text sizes of the pages. They apply to every `.logo-figure` except the Brand concept logo (`.concept-logo`, which has no frame). The Clear space diagram (3.1) is an SVG with its own dashed frame and is not changed; in 3.2 the margin moves an uploaded grid but not the grid drawn by the app.

## Consequences
* **+** One change restyles every box on every inner page, in the three templates, the full screen view and both PDFs, which all use the same page components.
* **+** With nothing changed, or with no Skin at all, every page looks exactly as before.
* **+** Templates stay layout only (ADR 0004).
* **−** A px value is a different share of the page in each view: 24 px corners look rounder on a small Grid thumbnail than on the A4 page of the PDF. This is how the text already behaves.
* **−** The Cover, Brand concept and the 3.1 diagram do not follow these settings.
