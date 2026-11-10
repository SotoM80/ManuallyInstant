# ADR 0027: The Cover's text is measured on the page (cqw)

## Status
Accepted — 2026-11-10

## Context
The Cover must look the same in every view: Grid, Overview, Pages, the full screen view and both PDFs. Its margins and gaps already grow with the page (they are percentages), but its text does not:
* The title is in **px**, halved in Grid and Overview (`TITLE_SCALE`) and whole in Pages and the PDF. "Designed by" is 11 px, or 13 px in Pages, and its line height is a fixed 26.1 px inherited from the site.
* The page itself is as wide as its column allows, and that depends on the view and on the window: for a 1440 px window, the Cover's content is 448 px wide in Grid, 438 px in Overview (drawn at half size), about 456 px in Pages (counted at half size, like its title), and about 365 px in the PDF (A4, 794 px).

So the same title has a little more or less room in each view, and a long one breaks into different lines. For example, "Northwind Coffee Roasters Visual Identity Guidelines" (Medium) takes two lines in Grid and Overview and one in Pages, and the PDF draws the title about 16 % bigger, relative to the page, than the preview does.

Options considered:
* **Overview laid out as wide as Grid** (a computed zoom). This fixes Grid against Overview only. Pages and the PDF still break differently, and it needs JavaScript that follows the window.
* **Every page laid out at A4 size and scaled down** (as the full screen view does). Every view would be exactly the PDF. But it is the biggest change (wrappers, scale per width, the draggable guides of 3.2, the view transitions), small text may look blurrier, and today's look of the preview changes.
* **The text measured on the page** with container query units (`cqw`, a hundredth of the page's width). The text then keeps the same share of the page in every view, at any window size, and so do its line breaks. It is CSS only, and `cqw` is already used by the Clear space diagram.

## Decision
We will make every `article.manual-page` an inline-size container and measure the **Cover's** title and "Designed by" in **`cqw`** of the page. Their sizes keep **today's look of the Grid view**, taken from a Grid page 460 px wide (a 1440 px window):
* **Title**: Small 2.6, Medium 3.5, Large 5.2 `cqw` (today 12, 16 and 24 px on that page). Its line height stays unitless (`1.15 ×` the Cover's Titles line spacing, ADR 0026).
* **"Designed by"**: 2.4 `cqw` (today 11 px), with a line height of 5.7 `cqw` (today 26.1 px) × the Cover's Text line spacing.

`TITLE_SCALE`, the `titleScale` prop and the Pages-view rule of "Designed by" go away. The other pages keep their px sizes and Pages-view rules for now: they can move to `cqw` later, page by page, with the same reference.

## Consequences
* **+** The Cover's title breaks into the same lines, and "Designed by" sits in the same place, in Grid, Overview, Pages, the full screen view and both PDFs, at any window size.
* **+** The PDF's Cover now looks like the preview. Before, its title was about 16 % bigger relative to the page.
* **+** It is CSS only: no new state, no JavaScript that follows the window, and the line spacing variables of ADR 0026 keep working.
* **−** The PDF's Cover title gets a little smaller than before, which is a visible change for anyone used to the old PDF.
* **−** Browsers round fractional font sizes, so in a rare case a word right at the edge could still break differently. Today the difference is 10 px or more; now it is a fraction of a pixel.
* **−** Until the other pages move to `cqw`, the manual mixes two ways of sizing text: the Cover in `cqw`, the rest in px with Pages-view rules.
