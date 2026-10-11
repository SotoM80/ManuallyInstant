# ADR 0005: Load Google Fonts through the CSS API

## Status
Accepted — 2026-10-11

## Context
Users pick a primary and a secondary font from Google Fonts. Bundling font files with the app would make it huge, and the frontend-only app (ADR 0002) has no server to proxy or cache them.

## Decision
We will load each chosen font at runtime by adding a `<link>` to the Google Fonts CSS2 API (`src/utils/googleFonts.ts`). We request only regular, bold, italic and bold italic, and the app sets `font-synthesis: none` so the browser never fakes a missing variant.

## Consequences
* **+** Any Google Font is available without growing the bundle.
* **+** Each font is added to `<head>` only once.
* **−** The app needs an internet connection, and the user's browser contacts Google's servers.
* **−** A font may not be ready right after it is selected; the PDF export must wait for fonts to load (for example with `document.fonts.ready`) before rendering.
* **−** Fonts without some of the four variants will only show the ones that exist.
