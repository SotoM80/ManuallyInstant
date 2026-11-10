# Technical Specification: Every Page the Same in Every View

## 1. What it does
Every page of the manual looks the same in **Grid, Overview, Pages, the full screen view and both PDFs**, in both orientations and at any window size. Each text takes the same share of the page and breaks into the same lines, and each piece of the page sits in the same place. The Cover already works this way (`cover.md`, ADR 0027). This spec brings the other nine pages along (ADR 0028).

Two changes make this possible:
1. **Measured on the page.** Every size of the inner pages that is in px today (font sizes, gaps, corners, the ✓ / ✕ mark) is measured in `cqw` instead: a hundredth of the page's width. The reference is the same as the Cover's: today's look of the **Grid** view, on a Grid page 460 px wide, so `cqw = px ÷ 4.6`. Every rule written only for the Pages view goes away: Pages is Grid, only bigger.
2. **In the brand fonts.** The inner pages are drawn in the brand's two fonts from the Typography section (ADR 0029), not in the system font. The system font changes its shapes and letter spacing with the size, so the same text takes a different share of the page in each view.

A test in a real browser keeps this true (ADR 0030).

## Why (measured in Chrome, 2026-11-10, 1440 px window)
Compared with Grid, before this change:

| | Overview | Pages | PDF (landscape) |
|---|---|---|---|
| Text size, as a share of the page | up to 2 % off | 14–34 % smaller | 29–39 % smaller |
| Texts breaking into a different number of lines | 1 | up to 4 per page | up to 4 per page |

* **Overview** lays each page out 10 px narrower than Grid, so a long text can break differently.
* **Pages** has its own px sizes, picked by eye, that are not twice the Grid ones.
* **The PDF** draws a landscape page 1123 px wide (a portrait one 794 px), while the preview's pages are as wide in both orientations: the same px text is a much smaller share of a landscape PDF page.

## Out of Scope
* The Cover (done in `cover.md`).
* The Skin's controls given in px: the image boxes' Corner radius and Thickness (`imageboxes.md`) and the Lines (`lines.md`). Lines stay hairlines in every view; they are not measured on the page.
* The mockup illustrations and photo mockups (already drawn to the page's size), and the Clear space diagram (already in `cqw` / `cqh`) and construction grid (in modules).
* Bold or italic brand fonts: the brand fonts are only drawn in Regular (`typography.md`), so the inner pages' titles are no longer bold.
* Letting the user pick other fonts for the inner pages than the two of the Typography section.

## 2. Interface

### Measured on the page
* Every `article.manual-page` is already an inline-size container (ADR 0027).
* Every size below changes from px to `cqw`, with the same value in every view. The Pages-view rules (`.manual-preview[data-view='pages'] …`, 28 today) are removed.
* The site's letter spacing (0.18 px, inherited) is measured on the page too, on every page: **0.04 `cqw`**. Letter spacing in `em` (the uppercase labels, 0.08 em) stays: it already follows the text.
* The grey placeholders of every page (`Your brand concept`, `Your color palette`…) take the Cover's: **2.8 `cqw`**, line height **5.7 `cqw`**.
* The line heights are already proportions (`linespacing.md`), so they follow.

| Element | Grid today | `cqw` |
|---|---|---|
| **Logo pages** (Brand concept, Anatomy, Logo versions, Clear space), **Usage** and **Mockups** | | |
| Brand name above the heading | 7 px (8 px on Brand concept and Anatomy) | 1.5 (1.75) |
| Page heading | 12 px (14 px on Brand concept and Anatomy) | 2.6 (3.05) |
| Numbered block title (`1.1 Philosophy`) | 6 px (7 px on Brand concept and Anatomy) | 1.3 (1.5) |
| Text of a block | 6 px (8 px on Brand concept and Anatomy) | 1.3 (1.75) |
| Card: type / name / role | 6 / 8 / 7 px | 1.3 / 1.75 / 1.5 |
| Card: sign between parts (`+`, `=`) | 14 px, 18 px below | 3.05, 3.9 below |
| Version name | 7 px | 1.5 |
| Empty logo / empty grid notes | 7 px / 6 px | 1.5 / 1.3 |
| Usage description | 6 px | 1.3 |
| Usage ✓ / ✕ mark | 12 × 12 px, 8 px text | 2.6 × 2.6, 1.75 |
| Mockup name | 6 px | 1.3 |
| Photo mockup note | 6 px, 4 px padding | 1.3, 0.87 |
| **Color palette** | | |
| Heading | 12 px | 2.6 |
| Color name | 8 px | 1.75 |
| Values (HEX, RGB, CMYK) and the CMYK note | 6 px | 1.3 |
| **Typography** | | |
| Heading | 12 px | 2.6 |
| "Aa" sample | 30 px (22 px in landscape) | 6.5 (4.8 in landscape, in every view) |
| Font name | 10 px | 2.2 |
| Role (`PRIMARY · HEADINGS`) and alphabet | 6 px | 1.3 |
| **Gaps and corners** | | |
| Gaps of 2 / 3 / 4 px | | 0.43 / 0.65 / 0.87 |
| Logo pages' blocks (8 px in Pages) | 4 px | 0.87 |
| Color chip and Brand concept logo corners | 4 px | 0.87 |
| Image box minimum height | 24 px | 5.2 |
| Stripes of an empty image box | 4 px every 8 px | 0.87 every 1.75 |

The "Aa" sample is smaller in landscape because a landscape page is shorter. Before, that rule only held in Grid and Overview. Now it holds in every view, so a landscape Typography page looks the same everywhere.

### In the brand fonts
* **Titles**, in the brand's **Primary** font: the brand name above the heading, the page headings, the numbered block titles and the Typography page's heading. They are the same "titles" as in `linespacing.md`.
* **The rest of the text**, in the brand's **Secondary** font: block texts, cards, versions, usage descriptions, colors' names and values, the CMYK note, the Typography page's roles, mockup names and notes, and the placeholders.
* The Typography page's samples, names and alphabets keep their own font, as today.
* While the Typography section is untouched, its defaults are used: **Montserrat** and **Open Sans** (`typography.md`). Both are loaded as soon as the Brand Manual opens.
* The fonts reach the pages as two CSS variables on every `article.manual-page`: `--font-titles` and `--font-text`. The Cover does not use them; it keeps the title's family (`cover.md`).

### The test in a real browser
* `npm run test:e2e` starts the app and opens it in Chromium with Playwright (`@playwright/test`). The tests live in `e2e/`, outside Jest's `test/` folder.
* It fills every section with sample text (no images needed), and then, in each template and orientation, measures every text of every page in Grid, Overview, Pages and the full screen view.
* For each text it compares its font size as a share of the page's width, and the number of lines it takes, with Grid. They must match: the share within 1 %, the lines exactly.
* jsdom (`npm test`) cannot lay text out, so it keeps checking the rules as text, as it does for the Cover.

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`).
* **Postconditions**: Every page shows each text at the same share of its width, broken into the same lines, in every view, orientation and window size, and in both PDFs.

## 4. Invariants
* Pages is Grid, only bigger; Overview is Grid, only smaller. No rule depends on the view.
* With the Typography section untouched, every inner page is drawn in Montserrat (titles) and Open Sans (text).
* A Google Font is always used for the pages' text, never the system font: the PDF is the same on every computer.
* The line spacing (`linespacing.md`) and line weight (`lines.md`) sliders work as before.

## Failure Modes
* **A brand font that fails to load**: the page falls back to `sans-serif`, the same in every view. The PDF waits for the fonts as today (`export.md`).

## 5. Given-When-Then Test Criteria

### Scenario 1: The Same Lines in Every View
* **Given**: The Logo section with a long Concept (4 lines in Grid).
* **When**: The user switches between Grid, Overview and Pages, and opens the full screen view.
* **Then**: The concept takes 4 lines in all of them, at the same share of the page's width.

### Scenario 2: Usage Descriptions
* **Given**: Correct use with 4 examples, each with a two-line description in Grid.
* **When**: The user chooses Pages.
* **Then**: Each description still takes two lines.

### Scenario 3: The Landscape PDF
* **Given**: Landscape, and a Color palette with 4 colors.
* **When**: The user makes the web PDF.
* **Then**: Its Color palette page shows the names and values at the same share of the page as in Grid (before, about a third smaller).

### Scenario 4: The Brand Fonts
* **Given**: The Typography section untouched.
* **When**: The user looks at the Color palette page.
* **Then**: The heading is drawn in Montserrat and the colors' names and values in Open Sans.

### Scenario 5: Changing the Brand Fonts
* **Given**: Primary font Montserrat, Secondary font Open Sans.
* **When**: The user picks Playfair Display as Primary and Lato as Secondary.
* **Then**: The titles of every inner page change to Playfair Display and the rest of their text to Lato, at once; the Cover does not change.

### Scenario 6: The "Aa" Sample in Landscape
* **Given**: Landscape.
* **When**: The user switches between Grid, Overview and Pages.
* **Then**: The "Aa" samples of the Typography page are 4.8 % of the page's width in all of them.

### Scenario 7: Any Window Size
* **Given**: A filled manual, in Pages.
* **When**: The user makes the window narrower or wider.
* **Then**: Every page grows or shrinks, and every text keeps its lines.

### Scenario 8: The Browser Test
* **Given**: The app as it is.
* **When**: `npm run test:e2e` runs.
* **Then**: It passes for every page, in the 3 templates and both orientations; changing one size of one view only (e.g. a new Pages-view rule) makes it fail.

## Build Order
1. The browser test (`e2e/`, `npm run test:e2e`). Run it first: it must fail today, page by page (Scenario 8).
2. The brand fonts on the inner pages, loaded from the start (Scenarios 4, 5).
3. Each page in `cqw`, one group at a time (Logo pages, Usage, Mockups, Color palette, Typography), removing its Pages-view rules, until the test passes (Scenarios 1–3, 6, 7).
4. `brandmanual.md`, `typography.md` and `export.md` point here; README.
