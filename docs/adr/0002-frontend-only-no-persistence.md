# ADR 0002: Frontend only, no persistence

## Status
Accepted — 2026-10-11 (amended by ADR 0018: an optional CMYK server; still nothing is saved)

## Context
ManuallyInstant is an MVP. Agencies fill in a brand manual (cover, logo, colors, fonts) and export it as PDF in one sitting. A backend would need hosting, accounts, storage for uploaded logos and a privacy policy for client brand assets, and none of that is needed to prove the idea.

## Decision
We will build the app as a static React + Vite frontend with no backend and no saving between sessions. All state lives in React memory. Uploaded logos are referenced with `URL.createObjectURL` (`src/components/BrandForm.tsx`) and never leave the browser.

## Consequences
* **+** Free and simple to host (any static host), with nothing to maintain on a server.
* **+** Client brand assets stay on the user's device.
* **−** Reloading or closing the tab loses all the work; a manual must be finished and exported in one session.
* **−** No sharing or collaboration between users.
* **−** PDF generation must happen in the browser (see the future PDF library ADR).
