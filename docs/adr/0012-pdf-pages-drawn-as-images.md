# ADR 0012: PDF pages drawn as images, with html-to-image and jsPDF

## Status
Accepted — 2026-10-16

## Context
The manual must be downloaded as two PDFs: one for print (high resolution, CMYK values highlighted) and one for the web (RGB/HEX, lightweight). The app is frontend only (ADR 0002), so the PDF is made in the browser. The pages are HTML laid out by the template's CSS (ADR 0004), with Google Fonts (ADR 0005), the user's logo images and an SVG skin (ADRs 0009–0011).

Options considered:
* **html2canvas + jsPDF**: draws the page into a canvas by re-implementing CSS. It does not understand `color-mix()`, which the templates use, so pages would fail or lose colors.
* **html-to-image + jsPDF**: puts the page into an SVG `foreignObject` and lets the browser itself draw it, so every CSS feature, font and SVG works as on screen. The result is an image per page.
* **jsPDF + svg2pdf.js (vector)**: selectable, sharp text at any zoom, but every page of every template must be drawn again by hand with jsPDF, and every font embedded as a TTF. Much more work, and a second layout to keep in step with the CSS.
* **The browser's print dialog (CSS `@page`)**: vector and faithful, but the user must go through the dialog and choose "Save as PDF" and its options; a page cannot download it by itself.

## Decision
We will draw every page as an image with **html-to-image** and put one image per A4 page in a PDF with **jsPDF**: PNG at 300 dpi for print, JPEG at 144 dpi for the web. The pages are drawn from an off-screen copy of the manual (`ExportPages`) in the Pages view, at A4 size and with no motion. Both libraries are loaded only when a download starts.

## Consequences
* **+** The PDF looks exactly like the preview, in every template, with every font and skin, and needs no second layout.
* **+** One click downloads the file.
* **+** The libraries add nothing to the app until they are used.
* **−** Text in the PDF cannot be selected or searched, and only stays sharp up to the chosen resolution (300 dpi is enough for print at 100 %).
* **−** The print PDF is heavy (several MB) because its pages are PNG.
* **−** Fonts from Google Fonts must be fetched again to be embedded in each image; a slow network makes the export slower.
* **−** html-to-image copies an `<svg>` in one piece, without the styles the CSS gives its shapes, so a shape styled by a class (`fill: none`, `stroke: currentColor`) comes out filled in black. Before drawing, the export waits until the copy stops changing (the construction grid redraws itself once it has read the logo's pixels), then writes every computed property of each SVG shape on the shape itself (`src/export/inlineSvgStyles.ts`), only in the off-screen copy. Drawings styled by attributes, like the skin, need nothing.
* **−** jsdom cannot draw pages, so tests mock the drawing and check the rest (which pages, which settings, the file name, the warnings).
* A vector PDF (svg2pdf.js) stays possible later, as a new ADR, for the print version.
