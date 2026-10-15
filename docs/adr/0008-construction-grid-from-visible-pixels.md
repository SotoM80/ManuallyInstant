# ADR 0008: Construction grid drawn from the logo's visible pixels

## Status
Accepted — 2026-10-15

## Context
The Clear space page has a block 3.2 *Construction grid*. Until now it only showed an image the user uploaded, or an empty striped box. Designers expect a grid like the ones in professional manuals: square modules over the logo, fitted to its shape, with X marked. The app is frontend only, with no server and no AI (ADR 0002).

Options considered:
* **Upload only.** Simple, but most users would see an empty box.
* **Detect the logo's geometry** (circles, angles, proportions such as "1.5X"). This needs image recognition: heavy, unreliable on varied logos, and against ADR 0002.
* **Draw a module grid fitted to the visible part of the logo.** Read the logo's pixels in a `<canvas>`, find the box where it is really drawn (ignoring transparent margins), and draw square modules over it in SVG.

## Decision
We will draw the grid ourselves, fitted to the logo's visible pixels, whenever no grid is uploaded. An uploaded grid always wins. The user chooses the density (*Grid modules*: 12, 16 or 24) and how many modules X measures (*X (modules)*: 1, 1.5, 2 or 3). The clear space diagram of 3.1 is drawn with the same geometry (`src/utils/logoBox.ts`), so X is the same measure in 3.1 and 3.2. The user can add dimension lines above and beside the grid as sequences of steps in X ("X 1.5X X", parsed in `src/utils/rulers.ts`). Each step is drawn `value × X` long, so the rulers follow X. The user can also click the grid's rulers to place guides (`src/utils/guides.ts`): the app then measures every gap between the logo's edges and the guides in X, and the guides of a side replace its typed ruler. The logo's overall width and height in X are always shown outside the grid.

How it works:
* `findVisibleBounds` (`src/utils/visibleBounds.ts`) scans RGBA pixels for the first and last drawn row and column. It is a pure function, so it is unit tested.
* `useVisibleBounds` draws the logo on a small canvas (at most 256px). This is allowed because the logo is a `blob:` URL of the user's own file (same origin).
* `ConstructionGrid` draws everything in an SVG measured in modules, so it scales to any page.

## Consequences
* **+** Every manual gets a real construction grid, with no upload and no new dependency.
* **+** It adapts to the logo's proportions and ignores empty margins.
* **−** It does not understand the shapes: the guides are placed by the designer, and a construction with circles still needs an upload.
* **−** A logo on an opaque background (a JPG) has no transparent margin, so the grid covers the whole image.
* **−** jsdom cannot read pixels: tests cover the pure scan and use the whole image for the drawing.
* **−** Guides are edited in the preview, not in the form (the only place in the app), work with a mouse only, and last while the Brand Manual page is open. Their clickable bands will need hiding in the PDF export.
