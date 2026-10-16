# ADR 0009: Skins drawn in SVG, measured in mm

## Status
Accepted — 2026-10-16

## Context
The manual gets **skins**: a decorative layer behind every page, made from two colors of the brand palette (see `specs/skins.md`). The first version has Linear, Radial, Dots and Stripes; Shapes and Textures come later. A skin must look the same in the preview, in every template, orientation and view, and later in both PDFs (Phase 4). The app is frontend only (ADR 0002).

ADR 0004 says templates cannot add their own decorations. A skin does not break it: it does not belong to any template, is chosen on its own and is the same layer under every layout, and the content stays the same. It is a new, separate choice, like the orientation.

Options considered:
* **CSS backgrounds** (`linear-gradient`, `radial-gradient`, `repeating-*`). Short to write, but sizes are in screen pixels instead of page mm, later presets (waves, textures) are hard or impossible, and a PDF library would not read them.
* **Canvas.** Can draw anything, but it is a bitmap: blurry when printed unless drawn very large, heavy in the PDF, and jsdom cannot draw on it, so tests would need mocks.
* **SVG.** Vector, with gradients and `<pattern>` tiles built in, and its `viewBox` can be the A4 page in mm. It is the same approach as the construction grid (ADR 0008).

## Decision
We will draw every skin as an SVG whose `viewBox` is the A4 page in mm (`210 × 297` or `297 × 210`). Each preset is a pure function `(params, colors, page) → shapes` in `src/skins/draw/`, and a single `SkinLayer` component turns its result into SVG elements behind the content of each page. Each SVG gets its own ids (`useId`). The skin stores palette colors by a stable id, not by position.

## Consequences
* **+** Sharp at any size; parameters in mm mean real millimetres of the printed page.
* **+** The drawing functions are pure, so they are unit tested; jsdom renders the SVG attributes without mocks.
* **+** The same pattern as the construction grid, so the code reads alike.
* **−** Angles must be converted by hand to match CSS (`0°` up, clockwise).
* **−** SVG ids are shared by the whole document. With seven pages and a gallery of previews (about a dozen SVGs), every one needs unique ids, or they paint with each other's definitions.
* **−** The palette needs a stable id per color, a small change to the Colors form and `PaletteColor`.
* **−** It is not yet known how the PDF library will handle SVG: gradients and patterns are widely supported, `feTurbulence` (needed by the later Textures) often is not. Textures wait for the PDF library ADR.
