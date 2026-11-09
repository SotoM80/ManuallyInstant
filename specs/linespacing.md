# Technical Specification: Line Spacing per Section

## 1. What it does
Each section of the manual (**Cover, Logo, Usage, Colors, Typography, Mockups**) can open or tighten the **line spacing** of its pages, with two sliders: one for its **titles** and one for the rest of its **text**. Every page of the section follows them: the Logo's on Brand concept, Anatomy, Logo versions and Clear space; the Usage's on Correct use and Incorrect use. They are set in a folded **Line spacing** group at the end of that section's form.

Each slider is a **percentage of today's spacing**, not a fixed value: the pages use different line heights today (the Cover title 1.15, the Typography page 1.2, the Color palette 1.25, the Logo pages 1.3), and 100 % keeps each one exactly as it is. With nothing changed, every page looks exactly as before (ADR 0026).

The line spacing is kept in the Skin, like the section backgrounds (`sectionbackgrounds.md`, ADR 0025), so the preview, the full screen view and both PDFs show it.

## Out of Scope
* Line spacing per page (the 4 Logo pages share one, and so do the 2 Usage pages), or per text (one value for a single title).
* Letter spacing, font sizes, paragraph spacing or the gaps between blocks.
* Fixed line heights in px or a typed value: only the two sliders.
* The big "Aa" sample of the Typography page (it is a sample of the letter, not a text: it keeps `line-height: 1`).
* The text drawn inside the SVGs of the Clear space page (the measures of 3.1 and the X labels of 3.2: they are measured in modules) and inside the mockup illustrations.
* The grey sample texts shown while a field is empty (`Your brand manual title`, `Designed by …`, `Coming soon`…).
* Moving text to make room: a text that no longer fits its block is clipped, as a long text is today.
* A line spacing for the Skin section (it has no page of its own).

## 2. Interface

### The Line spacing group
At the end of the Cover, Logo, Usage, Colors, Typography and Mockups forms, just before the Section background group, there is a **Line spacing** button that folds and unfolds the group. It starts folded every time the form is opened, like the Section background group. Its accessible name is `<Section> line spacing` (e.g. `Logo line spacing`) and it has `aria-expanded`. A folded group cannot be reached with the keyboard or by screen readers (`inert`).

```
▸ Line spacing                               ← folded

▾ Line spacing
    Titles   ─────●──── 100 %
    Text     ─────●──── 100 %
▸ Section background
```

| Control | Accessible name | Range | Step | Default |
|---|---|---|---|---|
| **Titles** | `<Section> title line spacing` | 50–200 % | 5 | 100 % |
| **Text** | `<Section> text line spacing` | 50–200 % | 5 | 100 % |

* Each slider shows its value next to it (`120 %`), with the look of the Skin's sliders (`.skin-control`).
* Every change reaches the pages at once (there is no Apply).

### What is a title and what is text
The spacing of each element is **its line height today × the slider**. "Today" is the line height it has with both sliders at 100 %.

| Section | Pages | Titles | Text | Today |
|---|---|---|---|---|
| **Cover** | Cover | the brand manual title | "Designed by" | title 1.15, text 1.45 × the site's font size (`1.45rem`, the line height it inherits) |
| **Logo** | Brand concept, Anatomy, Logo versions, Clear space | the brand name above the heading, the page heading, the numbered block titles (`1.1 Philosophy`, `3.2 Construction grid`…) | every other text: the concept, the cards' names and roles, the versions' names and uses, the clear space and minimum size notes | 1.3 |
| **Usage** | Correct use, Incorrect use | the brand name and the page heading | the examples' descriptions | 1.3 |
| **Colors** | Color palette | the heading `Color palette` | the colors' names and values, the CMYK note | 1.25 |
| **Typography** | Typography | the heading `Typography` | the fonts' names, roles and alphabets | 1.2 |
| **Mockups** | Mockups | the brand name and the page heading | the products' names and the notes of the photo mockups | 1.3 |

### On the pages
* Each page takes the two values of its section. The Skin's other settings (colors, layers, image boxes, lines) do not change.
* The values are the same in every template, orientation and view (Grid, Overview, Pages, full screen), and in both PDFs (the export draws the same pages, ADR 0012).

### In the code
* `src/skins/types.ts`: `SectionSpacing = { title: number; text: number }` (percentages, 50–200), and the Skin's new optional field `spacing?: Partial<Record<SectionId, SectionSpacing>>` (`NO_SKIN` has none, so every section is at 100 %).
* `src/skins/spacing.ts`: pure helpers: the spacing of a section (100 / 100 when it has none), changing one value from the newest Skin, and the CSS variables of a page (`--title-leading` and `--text-leading`, as factors: 120 % → `1.2`), found with `sectionOfPage` (`src/skins/sections.ts`).
* `src/components/LineSpacingField.tsx`: the folded group, rendered once for each section in `BrandManualPage`'s section loop, next to `SectionBackgroundField`, and folded the same way.
* `ManualPage.tsx`: sets the two variables on every `article.manual-page`, **the Cover included**.
* `src/templates/shared.css` and the templates' CSS: every line height listed above becomes `calc(<today> * var(--text-leading, 1))` or `calc(<today> * var(--title-leading, 1))`. `toTitleCss` (`src/data/titleOptions.ts`) does the same with `TITLE_LINE_HEIGHT` for the Cover title.

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`), in one of the six sections.
* **Postconditions**: Every title of the section's pages has its line height today × Titles, and every text of them its line height today × Text.

## 4. Invariants
* At 100 % / 100 %, every page looks exactly as before.
* A section's line spacing only changes the pages of its section, and never its colors, layers, image boxes, lines or another section.
* Every value is between 50 and 200, in steps of 5.
* The line spacing is kept when the template, orientation, view or page order change, and when the user goes to Home and back. Nothing is saved between sessions (ADR 0002).

## Failure Modes
* **Sliders** cannot go past their limits; nothing can be typed, so there is no error message.
* **A text that no longer fits** its block at a high value is clipped by its block, as a long text is today; the page never grows.

## 5. Given-When-Then Test Criteria

### Scenario 1: Today's Spacing by Default
* **Given**: A new manual.
* **When**: The user opens the Colors section and unfolds Line spacing.
* **Then**: Titles and Text are at 100 %, and the Color palette page has its line heights of today (1.25).

### Scenario 2: The Text of a Section
* **Given**: The Colors section.
* **When**: The user sets `Colors text line spacing` to 160 %.
* **Then**: The colors' names, values and the CMYK note of the Color palette page take a line height of `1.25 × 1.6` at once; its heading does not change; no other page changes.

### Scenario 3: The Titles of a Section
* **Given**: The Logo section.
* **When**: The user sets `Logo title line spacing` to 80 %.
* **Then**: The headings and numbered block titles of Brand concept, Anatomy, Logo versions and Clear space take `1.3 × 0.8`; their other text does not change; the Usage pages do not change.

### Scenario 4: The Cover
* **Given**: A Cover with a long title on two lines and "Designed by Studio X".
* **When**: The user sets `Cover title line spacing` to 140 % and `Cover text line spacing` to 70 %.
* **Then**: The title's lines move apart (`1.15 × 1.4`) and "Designed by" tightens (`1.45 × 0.7`); no inner page changes.

### Scenario 5: The "Aa" Sample Keeps Its Size
* **Given**: The Typography section.
* **When**: The user sets `Typography text line spacing` to 200 %.
* **Then**: The fonts' names, roles and alphabets take `1.2 × 2`; the "Aa" samples keep `line-height: 1`.

### Scenario 6: The Limits
* **Given**: The Mockups section.
* **When**: The user drags `Mockups title line spacing` all the way to each end.
* **Then**: It stops at 50 % and at 200 %.

### Scenario 7: Kept Between Pages
* **Given**: `Usage text line spacing` at 130 %.
* **When**: The user goes to Home and back to the Brand Manual.
* **Then**: The Usage pages keep `1.3 × 1.3`, and the slider shows 130 %.

### Scenario 8: Templates, Orientation and Views
* **Given**: `Typography title line spacing` at 150 %.
* **When**: The user changes to Template 3, Portrait and the Pages view, then opens the full screen view.
* **Then**: The Typography heading keeps `1.2 × 1.5` everywhere.

### Scenario 9: The Same in the PDF
* **Given**: `Logo text line spacing` at 120 %.
* **When**: The user makes the web PDF.
* **Then**: The Logo pages look as in the preview.

### Scenario 10: The Group Starts Folded
* **Given**: The Colors section with an unfolded Line spacing group.
* **When**: The user opens another section and comes back to Colors.
* **Then**: Line spacing is folded, and its values are kept.

## Build Order
1. Types, helpers and the CSS variables in `ManualPage`; the CSS reads them with today's values as fallbacks (Scenario 1).
2. `LineSpacingField` in the six forms, folded (Scenarios 6, 10).
3. Titles and text of each section, the Cover included (Scenarios 2–5).
4. Kept between pages; templates, orientation, views and the PDF (Scenarios 7–9). `brandmanual.md` and `skins.md` point here.
