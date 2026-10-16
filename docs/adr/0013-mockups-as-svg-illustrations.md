# ADR 0013: Mockups drawn as SVG illustrations from plain data

## Status
Proposed — 2026-10-16

## Context
The manual gets a **Mockups** page that shows the logo on products (`specs/mockups.md`): 6 products to start with (more later), up to 4 on the page, each with its own color and logo version, in the preview and in both PDFs. The app is frontend only (ADR 0002), and its PDF is the browser's own drawing of the pages (ADR 0012).

Options considered for **where the products come from**:
* **Photos with a free license** (in `public/mockups/`): realistic, but every photo must be found and its license kept; changing the product's color is hard; and placing the logo on a photo needs perspective or blend modes to look right.
* **The user uploads their own product photo** and places the logo: the most flexible, but much more work for the user, and for us (positioning, resizing and warping the logo).
* **Our own flat SVG illustrations**: no licenses, any product color with one fill, sharp at any size in the PDF. They look graphic, not photographic.

Options considered for **how the illustrations are stored and drawn**:
* **A. Plain data drawn by one component**: each product is an object in `src/mockups/products.ts` (`viewBox`, parts `{ d, fill }`, the logo's box), drawn by a single `MockupArt` component. The same pattern as the skin (ADR 0009): pure data, one renderer.
* **B. SVG files with named slots**: each product drawn in a design tool and saved as a file, with `data-slot="product"` shapes to recolor and an `id="logo-box"`. Richer art and editable by designers, but loading the files needs a new dependency or runtime parsing; the ids inside the files collide when the same product is drawn in the preview, the PDF copy and the section; design tools export `<style>` blocks, which the PDF copy loses (the problem `inlineSvgStyles` had to fix); and the slot names are a convention nothing checks.

## Decision
We will draw the mockups ourselves as flat SVG illustrations stored as **plain data** (option A). Each product is `{ id, name, group, color, viewBox, parts, logo }`; a part's `fill` is `'product'`, `'shade'`, `'light'` or a fixed HEX, and every color and opacity is written as an SVG **attribute**, never a CSS class. A product has no `<defs>`, gradients, clip paths or ids, because the same product is drawn up to three times at once (the page, the PDF copy, the form) and ids would collide (as with the skin, ADR 0009); if one is ever needed, it is built with `useId`. The logo is an SVG `<image>` centered in the product's box, with no perspective. The paths may be drawn in a design tool, keeping only their `d` values.

## Consequences
* **+** No licenses, no new dependency (it is plain SVG), and any product color.
* **+** Sharp in the print PDF, and drawn there exactly as in the preview: attributes survive the copy (ADR 0012).
* **+** The contract between the art and the app is a TypeScript type: tests check every product (the logo box inside its `viewBox`, a part painted with the product color).
* **+** Adding a product means adding one entry to `products.ts`.
* **−** The products look flat and graphic, with volume from a few translucent shapes only.
* **−** The logo never wraps around a curved product (a mug, a cap); it sits flat in its box.
* **−** Changing a product's drawing means editing path data in code, not a design file.
* Photographic mockups (option B, or uploads) stay possible later, as a new ADR: only how a product is drawn would change, not the section, the page or the data of the choice.
