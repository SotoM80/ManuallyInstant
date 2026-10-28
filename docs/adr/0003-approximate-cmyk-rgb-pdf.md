# ADR 0003: Approximate CMYK, print PDF stays in RGB

## Status
Superseded by ADR 0019 — 2026-10-28

## Context
Brand manuals list each color as HEX, RGB and CMYK, and the print PDF should highlight CMYK. An accurate CMYK conversion depends on an ICC color profile for the specific printer and paper, and real CMYK PDFs need server-side or specialized tooling. Neither fits a frontend-only app (ADR 0002).

## Decision
We will calculate CMYK with the standard naive formula from RGB (`K = 1 − max(R,G,B)`, then C, M, Y from the rest) and show it as a **value** in the manual. Both PDFs, including the print one, will use the RGB color space; the print PDF only differs in resolution and in which values it highlights.

## Consequences
* **+** Simple, fast and testable conversion with no extra dependencies.
* **−** CMYK values are approximate and can differ from what a printer produces; they are guidance, not a color-managed conversion.
* **−** A print shop may need to convert the PDF to CMYK itself.
* The app and the manual should label the CMYK values as approximate.
