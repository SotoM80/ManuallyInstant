# ADR 0018: An optional, stateless server, only for CMYK

## Status
Accepted — 2026-10-28

## Context
ADR 0002 keeps the app frontend only. ADR 0003 accepts approximate CMYK and an RGB print PDF because "real CMYK PDFs need server-side or specialized tooling". Agencies send the print PDF to print shops, so they need real CMYK pages and CMYK values that match what is printed (ADR 0019 decides how). That work needs a color-management library with an ICC profile, which the browser does not offer.

Login, user accounts and a WordPress plugin may come later; they are not part of this decision.

Options considered:
* **No server, CMYK in the browser** (lcms compiled to WebAssembly, or Ghostscript in WebAssembly): several MB more to download, little-used builds, and Ghostscript is AGPL.
* **A full backend** (accounts, storage, saved manuals): far more than CMYK needs, and it would decide login and persistence before they are discussed.
* **A small, optional server that only converts colors**: does one job, keeps nothing, and the app still works without it.

## Decision
We will add a small Node server in `server/` (its own package) that only converts to CMYK. It is **optional**: the app reads its address from `VITE_CMYK_SERVER_URL`, and without it every feature works as before, with approximate CMYK and an RGB print PDF. The server is **stateless**: it has no accounts, it writes nothing to disk, it never logs request bodies and it keeps no image in memory after a request. Its HTTP contract (`specs/cmykserver.md`) is small and versioned (`/v1`), so it can later be served by a WordPress plugin or behind a login without changing the app.

This amends ADR 0002: the app is no longer frontend only when the server is set, but it still saves nothing between sessions.

## Consequences
* **+** Real CMYK for print, with no new download in the browser.
* **+** Turning the server off, or never setting it up, brings back today's app exactly; the tests without a server stay as they are.
* **+** A small, documented contract that a WordPress plugin can implement or call.
* **−** Two processes to run in development (`npm run dev` and `npm run dev:server`) and, later, a server to host (a free instance may sleep, so the first export after a while is slower).
* **−** Pages of the manual and its palette colors now leave the browser, though only to the server the studio sets up, and only for one request.
* **−** v1 has no login: anyone who knows the address can use the server. CORS stops other websites, not scripts. A login is a later decision.
