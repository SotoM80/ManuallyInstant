# ADR 0024: A sharper web PDF, at 216 dpi and JPEG quality 0.9

## Status
Accepted — 2026-10-30

## Context
ADR 0012 draws every page of the PDF as an image: PNG at 300 dpi for print, JPEG at 144 dpi and quality 0.82 for the web, so the web PDF stays light. Opened in a PDF viewer, the web PDF's text looks blurry.

A web PDF of 10 pages, measured: 10 JPEG images of 1191 × 1684 px, 744 KB, and no text of its own (the text is pixels of the image). At 144 dpi a 14 px text is about 21 px tall in the image, and a 10 px one about 15 px. On a Retina screen, 100 % zoom already shows the image pixel for pixel, so any zoom above it is blurry. JPEG is made for photos: around sharp edges, such as letters, it leaves halos, and it keeps less detail of color than of light, so colored text on a colored background is softer still.

Options considered:
* **216 dpi, JPEG 0.9**: the same drawing with more pixels and less loss. Text is 1.5 times taller in pixels; the file is about 2.5 times heavier.
* **PNG for the web**: no halos, but several times heavier, close to the print PDF, which is no longer "lightweight".
* **A vector PDF** (svg2pdf.js): real, selectable text, sharp at any zoom, but every page must be drawn again by hand (ADR 0012 leaves it for a new ADR).

## Decision
We will draw the web PDF at **216 dpi** in **JPEG at quality 0.9**. The print PDF does not change (300 dpi, PNG). This amends ADR 0012 (the web PDF's resolution and quality).

## Consequences
* **+** Text in the web PDF reads sharp at 100 % and stays readable when zoomed in, on Retina screens too.
* **+** Only one setting changes (`EXPORT_SETTINGS.web` in `src/export/exportSettings.ts`); how pages are drawn stays as ADR 0012 says.
* **−** The web PDF is about 2.5 times heavier: about 1.8–2 MB for 10 pages instead of about 0.75 MB. Still well under the print PDF.
* **−** Drawing each page takes longer (2.25 times more pixels).
* **−** Text is still an image: it cannot be selected or searched, and it blurs past about 150 % zoom. Only a vector PDF would fix that.
