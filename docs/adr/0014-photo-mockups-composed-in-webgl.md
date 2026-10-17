# ADR 0014: Photo mockups composed in WebGL, shown as images

## Status
Proposed — 2026-10-16

## Context
ADR 0013 drew the mockups as flat SVG illustrations, and left photographic mockups for later. Designers want realistic ones: a real product photo, tinted to the brand's color, with the logo following the product's angle, curve and folds, placed by dragging it, and the possibility to add their own photos (`specs/mockups.md`, *Photo mockups*). The illustrations stay: a product is `illustration` or `photo`.

Constraints: frontend only and nothing saved (ADR 0002); the PDF is the browser's own drawing of an off-screen copy of the pages (ADR 0012), which already showed that styles inside an SVG get lost, and CSS 3D transforms or blend modes are a risk in that copy.

Options considered for **composing** a photo mockup:
* **CSS** (`transform: matrix3d`, `mix-blend-mode`) over an `<img>`: no code to draw, but no curves or folds, and the PDF copy may not keep 3D transforms or blend modes.
* **Canvas 2D**: perspective by cutting the logo into many small triangles is possible, but folds (moving each pixel) are slow, and blending is limited.
* **WebGL with our own small renderer**: the GPU draws the logo on a mesh (perspective and curves), moves it with the photo's brightness (folds), tints the product and blends, fast enough to follow a drag. No dependency, but more code to write.
* **PixiJS** (≈ 450 KB) or a similar library: the same power with less code, but a large dependency for one section.

Options considered for **the maps** that make it realistic:
* Separate shading and displacement images for every photo: precise, but one or two extra files to make per template.
* **Derived from the photo's own brightness**: the template only needs the photo, its mask and the logo area. Good enough for light, neutral product photos, which is what the app asks for.

## Decision
We will compose every photo mockup in **WebGL with our own small renderer** (`src/mockups/render/`), and show the result as a **PNG image** in the page. The product is tinted and the logo is shaded and bent using the **photo's own brightness**; a template is only a photo, a mask, a logo area (a rectangle, then four corners, then a grid of points) and a few settings. The geometry (homography, the grid, point-in-polygon, placement) lives in pure functions. Templates made in the editor or from an uploaded photo live in this session only; the editor can download a template for the developers to add to the app. We build it in three phases (flat, perspective, curves and editor), each usable on its own. This amends ADR 0013.

## Consequences
* **+** Realistic mockups with perspective, curves and folds, and a product of any color.
* **+** The page and both PDFs show the same image: an `<img>` survives the PDF copy as is.
* **+** No new dependency; adding a shipped template is a photo plus a few lines of data.
* **+** The geometry is unit tested; the section, the page, the colors, the logo versions and the export are reused unchanged.
* **−** WebGL is a new kind of code in the project, and jsdom cannot run it: the renderer is mocked in tests, and the look is checked by hand.
* **−** Photos must be found, licensed and recorded (`public/mockups/LICENSES.md`); they weigh far more than illustrations.
* **−** Brightness-derived maps work for light, neutral photos; a dark or busy photo looks less real.
* **−** A browser without WebGL shows a message instead of the photo mockup.
* **−** Templates made by users are lost when the page is refreshed (ADR 0002); keeping them would need a new ADR.
