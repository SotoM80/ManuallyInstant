# ADR 0028: Every page measured on the page (cqw)

## Status
Accepted — 2026-11-10

## Context
ADR 0027 measured the Cover's text in `cqw`, so the Cover now looks the same in every view and in the PDF. A measurement of the other nine pages in Chrome (`everyview.md`) showed the same problem there, stronger:
* **Pages** has its own px sizes (28 rules written only for that view), picked by eye: its text is 14–34 % smaller than Grid's, as a share of the page, and up to 4 texts per page break into a different number of lines.
* **Overview** lays each page out 10 px narrower than Grid, so a long text can break differently.
* **The landscape PDF** draws its pages 1123 px wide, while the preview's landscape pages are as wide as the portrait ones: its px text is 29–39 % smaller than in Grid. Since Landscape became the default, most PDFs are like this.

Options considered: the same three as in ADR 0027 (a computed zoom for Overview, every page at A4 size and scaled, or `cqw`). ADR 0027 chose `cqw` for the Cover, and the measurement after it showed 0 % difference in every view.

## Decision
We will measure every size of the inner pages that is in px today (font sizes, gaps, corners, the Usage mark) in **`cqw`**, with the Cover's reference: today's Grid look on a Grid page 460 px wide (`cqw = px ÷ 4.6`). We will remove every rule written for one view only, so **Pages is Grid, only bigger**. The site's inherited letter spacing becomes 0.04 `cqw` on every page, and the placeholders take the Cover's size.

The Skin's controls given in px (image box corners and outline, Lines) stay in px: they are hairlines and frames the user sets by eye, not part of the layout.

## Consequences
* **+** Every page looks the same in Grid, Overview, Pages, the full screen view and both PDFs, in both orientations and at any window size.
* **+** One set of sizes instead of two: about 45 sizes and 28 Pages-view rules become one value each.
* **+** The landscape PDF stops shrinking its text by a third.
* **−** Pages looks different from before: its text grows 14–34 % to match Grid. The PDF's text grows too, mostly in landscape.
* **−** `cqw` values are less readable than px (1.75 instead of 8 px); the spec keeps the table of today's px next to them.
* **−** A new size added later in px would bring the problem back. The browser test of ADR 0030 is there to catch it.
