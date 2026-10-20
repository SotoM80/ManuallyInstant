# ADR 0015: Logo layers read from SVG in the browser

## Status
Proposed — 2026-10-20

## Context
Designers build logos in Illustrator with each piece on its own layer (logotype, tagline). The Anatomy group of the Logo section asks for one image per part, so today they must export every piece by hand. They want to upload the logo once and keep its layers (`specs/logolayers.md`).

Constraints: frontend only, nothing saved (ADR 0002); a new image waits for Apply (ADR 0007); the PDF draws each page as an image (ADR 0012).

Options considered for the **file**:
* **`.ai` files**: the layers live in Adobe's private data. Saved "PDF compatible" (the default), an `.ai` holds a PDF where the layers may be kept as optional content, readable with pdf.js: a library of more than 1 MB, and files saved without that option or flattened bring no layers.
* **PDF exported from Illustrator** with "Create Acrobat Layers": the same pdf.js cost, and one more export setting to remember.
* **SVG exported from Illustrator** with *Object IDs: Layer Names*: each layer is written as a top-level `<g>` named after it (`data-name="Capa 1"`), with shared styles in `<defs>` (e.g. `fill-rule: evenodd`, which keeps the holes of the letters). The browser reads it with `DOMParser`, with no library.

Options considered for **cropping and ordering** a layer (both need where it is drawn):
* **`getBBox()`**: needs the SVG placed in the page as markup, where an `onload` attribute in a file from a client would run; it also leaves out strokes and filters.
* **Drawing the layer as an image on a canvas** and reading its visible pixels, as the construction grid already does (ADR 0008, `findVisibleBounds`): an SVG drawn as an image never runs scripts, and the pixels include strokes and filters.

## Decision
We will read the layers of an **SVG** with `DOMParser`, and turn each visible top-level group that draws something into an SVG of its own (the root, every non-drawing element such as `<defs>` and `<style>`, and only that layer). Each one is drawn **as an image** on a canvas to find its visible box with `findVisibleBounds`, which crops it and orders the parts from left to right. `.ai` and `.pdf` stay out of scope for now.

## Consequences
* **+** No new dependency; works offline, like the rest of the app.
* **+** The user's SVG is never placed in the page as markup, so nothing in it can run.
* **+** Each part keeps the file's own colors, gradients, clip paths and fill rules, and stays vector in the preview (the PDF draws it at its own resolution, ADR 0012).
* **−** The user has to export the logo to SVG first, with Layer Names; the form explains how.
* **−** It relies on how Illustrator writes layers (top-level groups, `data-name`); SVGs from other tools may come without layers and simply make no parts.
* **−** The box is found on a scan of limited size, so the crop is precise to about a pixel of the scan, covered by a small margin.
* **−** jsdom cannot draw images: tests mock the measuring step.
