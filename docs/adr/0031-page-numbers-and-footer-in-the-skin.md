# ADR 0031: Page numbers and footer in the Skin, placed by the template

## Status
Accepted — 2026-11-11

## Context
A printed identity manual usually numbers its pages and repeats a short line at their foot (the brand, the document, the year). The user wants both: a page number and a footer text on the pages. Four questions had to be answered:
* **Where are they set?** In the **Skin** (which already sets everything shared by the inner pages: colors, image boxes, lines), in a **new section** "Footer", or as **one switch** in the preview toolbar that builds the text from the brand name and the title.
* **Who decides where they sit?** The **template**, as for every other piece of content (ADR 0004), or the **user** (left, center, right).
* **Which pages?** All of them, or only the inner pages.
* **Can it be left out?** The user wants to use the footer or not, at will, without losing what was typed.

## Decision
We will set the footer in a **Footer** group of the **Skin**: a **Show footer** switch (off by default) and, under it while it is on, a **Page numbers** checkbox (on) and a free **Footer text** (empty). Turning Show footer off hides the footer from every page and keeps the two values. They appear on the **inner pages** only, and the **template places them** (centered in Template 1, text left and number right in Template 2, in the side column in Template 3). The Cover counts as page 1 and shows no number; numbers follow the manual's natural order, not the preview's. The footer is measured on the page (`cqw`, ADR 0028), in the Secondary font (ADR 0029) and the Page text color. It is kept as an optional part of the Skin (`footer?`), like `spacing` and `lines` (ADR 0026).

## Consequences
* **+** One place sets what every inner page shares, as the user already knows from the Skin; the Cover stays apart, as it does for colors.
* **+** The templates keep their one rule: they decide where content sits, never what it is.
* **+** The footer is optional: with Show footer off (the default) nothing changes, so existing manuals and tests are not affected, and turning it off and on again loses nothing.
* **+** The browser test (ADR 0030) measures the footer with every other text, so it looks the same in every view and PDF from the start.
* **−** The footer text is content kept in the Skin, which is otherwise about looks.
* **−** The user cannot move the footer, change its size or its number format without a new decision.
* **−** In Template 3 a long text is cut to the side column's width.
