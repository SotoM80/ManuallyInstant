# ADR 0029: The inner pages in the brand fonts

## Status
Accepted — 2026-11-10

## Context
The text of the inner pages (headings, concept, cards, colors' names and values, usage descriptions…) is drawn in the site's font, `system-ui`. Only the Typography page's samples use the brand fonts. Two problems:
* `system-ui` is not one font: on a Mac it is SF Pro, which switches between a Text and a Display design and changes its letter spacing with the size. The same text then takes a different share of the page in each view, even when every size is measured on the page (`cqw`, ADR 0028). It is what broke "Designed by" on the Cover (ADR 0027).
* On another computer it is another font (Segoe UI on Windows), so the PDF depends on where it was made.

Options considered:
* **The brand fonts** of the Typography section: Primary for titles, Secondary for the rest.
* **The Cover title's font** everywhere.
* **One fixed Google Font**, whatever the user picks.

## Decision
We will draw the inner pages in the **brand fonts**: their titles (the same ones as in `linespacing.md`) in the **Primary** font and the rest of their text in the **Secondary** font, both in Regular, as the brand fonts are loaded (`typography.md`). While the Typography section is untouched, its defaults are used (Montserrat and Open Sans), and both are loaded as soon as the Brand Manual opens. They reach the pages as CSS variables on every `article.manual-page` (`--font-titles`, `--font-text`). The Cover keeps the title's family (ADR 0027).

## Consequences
* **+** The manual is set in the brand's own fonts, as a real identity manual is: the Typography page is not the only place they show.
* **+** Google Fonts keep the same shapes at every size and on every computer, so the views and the PDF match.
* **+** Changing a brand font restyles the whole manual at once, with no new control.
* **−** The look of every inner page changes, even for a user who never opens the Typography section (Montserrat and Open Sans instead of the system font).
* **−** Titles are no longer bold: the brand fonts are only loaded in Regular, because some have no bold and Google refuses a request for a missing one.
* **−** Two more font files load at the start, and the PDF embeds them.
