# Technical Specification: Page Numbers and Footer

## 1. What it does
Every inner page of the manual (every page but the Cover) can show a **footer** at its bottom: its **page number** and a short **footer text** of the user's (e.g. `Northwind Coffee · Brand Guidelines 2026`). Both are set once, in a **Footer** group of the **Skin** section, and reach every inner page at once. The footer is **optional**: a **Show footer** switch turns it on or off for the whole manual, and turning it off keeps what was set. As with the rest of the content, the **template decides where they sit** (ADR 0004); the Skin decides whether they are there and what the text says (ADR 0031).

With nothing changed (Show footer off) every page looks exactly as before.

## Out of Scope
* A footer or number on the Cover.
* A different footer per page or section, or a header.
* Choosing the footer's position, size, font, color or number format (`2`, `02`, `2 / 10`…). The position is the template's; the rest follows the page (see *On the pages*).
* A table of contents, or numbering that starts somewhere else than the Cover.
* Fields in the footer (the date, the brand name taken from the Logo section…): the text is typed by hand.
* The Full screen view's Overview (decided later).

## 2. Interface

### Group "Footer" (inside "6. Skin")
After the **Lines** group and before **Layer gallery**, a group with the legend **Footer**:

| Control | Kind | Default |
|---|---|---|
| **Show footer** | checkbox | off |
| **Page numbers** | checkbox, only while Show footer is on | on |
| **Footer text** | text field, one line, up to 80 characters, only while Show footer is on | empty |

* **Show footer** is the switch for the whole footer. Off: no page has a footer, and Page numbers and Footer text are hidden from the form. On: they appear under it, and the pages show the footer they ask for.
* Turning Show footer off **keeps** Page numbers and Footer text as they were, so turning it on again brings the same footer back (as the image boxes' Thickness is kept while Outline is off, `imageboxes.md`).
* Turning it on for the first time shows the page numbers at once (Page numbers starts on), so the switch always has a visible effect.
* Every change reaches the pages at once (there is no Apply).
* Spaces at the start and the end of the text are not drawn; a text of only spaces counts as empty.
* The checkbox and the field have the look of the Skin's other controls (like **Outline** of Image boxes and the Cover's text fields).

```
6. Skin
  Page background  [●] #FFFFFF
  Page text        [●] #000000
  Image boxes      (Corner radius, Inner margin, Outline, Thickness)
  Lines            (Decorative lines, Technical lines)
  Footer
    ☑ Show footer
      ☑ Page numbers
      Footer text  [ Northwind Coffee · Brand Guidelines 2026 ]
  Layer gallery ⌄
```

### The number
* The **Cover counts as page 1 but shows no number**, as in a printed book: Brand concept is **2** and Mockups is **10**.
* The number is the page's place in the **natural order** of the manual (`MANUAL_PAGES`, the order of the PDF and the Full screen view), never its place in the preview: when an open section brings its pages to the top of the preview, they keep their numbers.
* Written as a plain number: `2`, `10`.

### On the pages
* Only on the **inner pages**; the Cover never has a footer.
* Show footer off → no footer at all, whatever Page numbers and Footer text say.
* With Show footer on: numbers on and a text → both; numbers on and no text → the number only; numbers off and a text → the text only; neither → no footer at all (nothing is added to the page).
* The footer sits in the page's **bottom margin**, under the content, so it never covers or moves it. Its base is **3.5 `cqw`** above the page's bottom edge, and it keeps the page's side margins (8 % of the width, as the content).
* In the brand's **Secondary** font (ADR 0029), **1.3 `cqw`** (the size of the pages' smallest texts, ADR 0028), in the Skin's **Page text** color, at the line spacing of the page's section (`--text-leading`, `linespacing.md`).
* On **one line**: a text too long for its room is cut with `…`.
* It is drawn over the Skin's layers and the section's background, like the rest of the content.

### Templates
```
Template 1               Template 2               Template 3
┌──────────────┐         ┌──────────────┐         ┌──────┬───────┐
│              │         │              │         │      │       │
│   content    │         │   content    │         │ side │content│
│              │         │              │         │      │       │
│      2       │         │Northwind…   2│         │2     │       │
│ Northwind …  │         └──────────────┘         │North…│       │
└──────────────┘                                  └──────┴───────┘
```
* **Template 1**: centered: the number, with the text under it.
* **Template 2**: one line: the text on the left, the number on the right.
* **Template 3**: in the **side column**, aligned left: the number, with the text under it. The text is cut to the column's width.

### Accessibility
* The footer is a `<footer>` inside the page's `article`, so a screen reader reads it as part of that page. The number is read as is (`2`); the page's name (`Brand concept`) does not change.

### In the code
* `src/skins/types.ts`: the Skin gets an optional `footer?: { shown: boolean; numbers: boolean; text: string }`. Missing → not shown, numbers on and no text, as with `spacing` and `lines` (ADR 0026).
* `src/skins/footer.ts`: pure functions: `skinFooter(skin)` (the footer with its defaults), `setFooter(skin, part)`, and `pageNumber(page)` (its place in `MANUAL_PAGES`, the Cover being 1). Unit tested.
* `src/components/PageFooter.tsx`: draws the footer of one page, or nothing. `ManualPage` puts it after the content of every inner page, so the preview, the Full screen view and both PDFs show it.
* `SkinForm`: the Footer group.
* The templates' CSS places it (`shared.css` and `template3.css`), every size in `cqw`.

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`).
* **Postconditions**: Every inner page shows the footer the Skin asks for, placed by the current template; the Cover shows none.

## 4. Invariants
* All inner pages always show the same footer text, and each its own number.
* A page's number never depends on the order of the preview, the template, the orientation or the view.
* The footer never covers, moves or shrinks the content of a page.
* It looks the same in Grid, Overview, Pages, the Full screen view and both PDFs (ADR 0028): `npm run test:e2e` measures it with every other text.
* Show footer off always means no footer on any page; turning it off never loses Page numbers or Footer text.
* The footer is kept with the Skin when the user moves between pages, and reset (Show footer off, numbers on, no text) when the browser page is refreshed.

## Failure Modes
Nothing can be wrong: the text field takes any text up to 80 characters (it stops there), and the checkboxes have two states.

## 5. Given-When-Then Test Criteria

### Scenario 1: Nothing by Default
* **Given**: The user opens the Brand Manual page.
* **When**: The user looks at the Skin section and the pages.
* **Then**: Show footer is off, Page numbers and Footer text are not shown, and no page has a footer.

### Scenario 2: Turning the Footer On
* **Given**: The Skin section, Show footer off.
* **When**: The user ticks Show footer.
* **Then**: Page numbers (ticked) and Footer text (empty) appear under it, and Brand concept shows `2`, Anatomy `3` … Mockups `10`; the Cover shows no number.

### Scenario 2b: Turning the Footer Off Keeps It
* **Given**: Show footer on, Page numbers on and Footer text `Northwind Coffee`.
* **When**: The user unticks Show footer, then ticks it again.
* **Then**: While it is off, no page has a footer and the two fields are hidden; once on again, every inner page shows its number and `Northwind Coffee` as before.

### Scenario 3: Numbers Follow the Manual, Not the Preview
* **Given**: Show footer and Page numbers on.
* **When**: The user opens the Colors section, which brings Color palette to the top of the preview.
* **Then**: Color palette still shows `8`.

### Scenario 4: Footer Text
* **Given**: The Skin section, Show footer on.
* **When**: The user types `Northwind Coffee` in Footer text.
* **Then**: Every inner page shows `Northwind Coffee` in its footer at once; the Cover does not.

### Scenario 5: Text Only
* **Given**: Show footer on, Footer text `Northwind Coffee`, Page numbers off.
* **When**: The user looks at Brand concept.
* **Then**: Its footer shows `Northwind Coffee` and no number.

### Scenario 6: Placed by the Template
* **Given**: Show footer on, Page numbers on and Footer text `Northwind Coffee`.
* **When**: The user switches between Template 1, 2 and 3.
* **Then**: The footer is centered with the number above the text (1), on one line with the text left and the number right (2), and in the side column, number above text (3); its text and numbers never change.

### Scenario 7: Every View and the PDF
* **Given**: Show footer on, Page numbers on and a Footer text.
* **When**: The user switches between Grid, Overview and Pages, opens the Full screen view, and makes both PDFs.
* **Then**: The footer is at the same share of the page and on one line in all of them.

### Scenario 8: The Page's Colors and Fonts
* **Given**: Show footer on, Page text `#3E2723` and Secondary font Lato.
* **When**: The user looks at a footer.
* **Then**: It is drawn in Lato, in `#3E2723`.

### Scenario 9: Kept Between Pages
* **Given**: Show footer on, Page numbers on and Footer text `Northwind Coffee`.
* **When**: The user goes to Home and back to Brand Manual.
* **Then**: The Skin section still shows Show footer on with both values, and the pages still show both.

## Build Order
1. `footer.ts` with its unit tests (Scenarios 1–3, 2b).
2. The Footer group in the Skin and `PageFooter` on the pages (Scenarios 2, 4, 5, 8, 9).
3. Its place in each template, in `cqw` (Scenario 6).
4. The browser test fills the footer, so it is measured in every view (Scenario 7).
5. `skins.md`, `templates.md`, `export.md` point here; README.
