# ADR 0036: Extra mockup pages for photos that do not fit on the Mockups page

## Status
Accepted — 2026-11-16

## Context
The Mockups page shows up to 4 mockups, and 4 are ticked by default (`mockups.md`). A photo the user uploads (or generates) opens the template editor; **Use now** adds its template to the list and ticks it only if there is room. With the defaults there never is: the editor closes, the photo waits unticked in the list, and the page does not change. To the user, Use now does nothing.

The user wants such a photo on a **new page**, almost the size of the page, with a **margin** slider and an optional **grid** (columns × rows) to fit more photos on one page; without a grid, each new photo takes a page of its own. The grid and the margin are chosen once, for every extra page. A photo often already carries the logo, so on these pages the logo is **optional**: with no logo chosen, only the photo is shown.

Until now the manual has had exactly 10 pages, listed once in `MANUAL_PAGES`. The preview, the page numbers (footer and labels), full screen, the PDF progress (`3/10`) and many tests read that list.

Options considered:
* **Swap**: the new photo takes the place of a ticked mockup of its group. Keeps 10 pages, but removes a mockup the user did not ask to remove, and gives no room for more photos.
* **A note** asking to untick a mockup first: keeps 10 pages, still one more step, and still at most 4 mockups.
* **Extra pages after the Mockups page**, generated from the photos: what the user asked for; the page list becomes dynamic.

## Decision
When mockups are already ticked, **Use now** puts the new photo on **extra mockup pages** (`Mockups 2`, `Mockups 3`…) after the Mockups page. They hold the photos in a grid of **Columns × Rows** (1–3 each, default 1 × 1: a page per photo) inside a **Margin** (0–20 % of the page width, default 8 %), set once for all of them in a **More pages** block of the Mockups section, where each photo can also be moved, removed, edited or given a logo. Their logo starts as **No logo**, a new choice of the Logo select (for every mockup), which shows the photo alone, with no placeholder.

The list of pages is worked out from the mockups (`manualPages(extraCount)`: the 10 fixed pages, then the extra ones) and passed to everything that read `MANUAL_PAGES`. The extra pages belong to the Mockups section, so they take its skin settings and are featured with it.

Amended the same day, after trying it: at first a photo went to an extra page only with the Mockups page full (4). The app ships 3 illustrations, so there was always room, no page was ever added, and the More pages block never showed. As the user asked, a photo goes to a new page whenever mockups are already ticked.

Amended again: with a grid larger than 1 × 1, the user could not keep one photo on a page of its own. Each photo now has an **Own page** checkbox (`extraOwn`): it takes a whole page alone, and the others keep filling the grid in order. The pages are worked out by one pure function, `extraPages(mockups)`, which everything else (count, page photos, a page's grid) reads. Own page shows only with a grid of more than one cell (at 1 × 1 it changed nothing, which read as broken), and a photo ticked onto the Mockups page gets **Move to a page of its own** to go back.

## Consequences
* **+** Use now always shows the photo on a page, with no extra step.
* **+** Photos that already carry the logo can be shown as they are.
* **+** The 10 pages, and every test with no extra photo, stay as they were.
* **−** The manual no longer has a fixed number of pages: the page numbers, full screen, the export progress and the PDFs follow a list that changes. Tests that count 10 pages count the fixed ones.
* **−** A photo is on the Mockups page or on an extra page, never both: ticking a photo of an extra page moves it to the Mockups page; there is no way back except Use now again.
* **−** The extra pages look the same in the three templates (only CSS: they can differ later).
* **−** A limit of 24 extra photos, to keep the PDF (and the CMYK conversion, one page per request) reasonable.
