# ADR 0030: Layout tests in a real browser, with Playwright

## Status
Accepted — 2026-11-10

## Context
The app's tests run in Jest with jsdom (the project's stack, `CLAUDE.md`), which builds the DOM but never lays text out: it cannot tell how wide a text is or how many lines it takes. So the problem of ADRs 0027 and 0028 (a page that looks different in each view) was only found by measuring by hand in Chrome, and nothing stops it from coming back when a size is added later in px or for one view only.

Options considered:
* **Keep measuring by hand** in the browser when working on the pages. No new dependency, but easy to forget.
* **A browser test that stays in the repo**, with Playwright (`@playwright/test`): it starts the app, fills it and measures every text in every view.
* **Screenshot comparison.** It catches any visual change, but it is brittle (fonts and antialiasing differ between machines) and the user prefers not to have images made on their computer.

## Decision
We will add **Playwright** as a dev dependency and a **`npm run test:e2e`** script that runs the tests in `e2e/` in Chromium, against the Vite dev server. The first test measures, for every page, template and orientation, each text's font size as a share of the page and its number of lines, in Grid, Overview, Pages and the full screen view, and requires them to match Grid (`everyview.md`). It measures numbers only: no screenshots. Jest (`npm test`) stays as it is, for everything else.

## Consequences
* **+** The "same in every view" rule is checked by a machine, in a real browser, every time the test runs.
* **+** It is the place for other checks jsdom cannot do (layout, fonts, the PDF's pages).
* **−** A new dev dependency and a browser download (Chromium, about 150 MB, with `npx playwright install chromium`).
* **−** It is slower than Jest (it starts the app and a browser), so it runs on its own, not with `npm test`.
* **−** It needs the Google Fonts to load, so it needs a network connection.
