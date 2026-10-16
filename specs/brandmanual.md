# Technical Specification: Brand Manual Page Layout

## 1. What it does
Organizes the Brand Manual page in two columns: on the **left**, a live preview of how the manual's pages are being organized; on the **right**, all the sections used to create the manual, one below the other.

## Out of Scope
The content of the Logo section (it will have its own future spec). The content of the Colors and Typography sections (see `colorpalette.md` and `typography.md`). Zooming into a page of the preview. Opening a section by clicking its page in the preview.

## 2. Interface
### Layout
* **Column widths**: The page uses almost the whole window (96%). The sections (right) are a narrow column of 320–380px, and the preview (left) takes the rest of the width (`minmax(0, 1fr)` / `minmax(320px, 380px)`).
* **Page Orientation** (top of the left column, above the thumbnails): A group labeled "Page orientation" with two options:
  * **Portrait** (vertical): A4 standing, `210 × 297`. Selected by default.
  * **Landscape** (apaisado): A4 lying down, `297 × 210`.

  Choosing an option changes the shape of all four page thumbnails immediately. The chosen orientation is also the one the PDF export will use (Phase 4).
* **Preview View** (next to Page orientation): A group labeled "Preview view" with three options:
  * **Grid**: the four pages as small thumbnails in a 2 × 2 grid. Selected by default.
  * **Overview**: four pages per row, so many pages can be seen at once; when the manual has more pages they continue on the next rows. Each page looks like a Grid thumbnail drawn at half size. The preview stays sticky.
  * **Pages**: a closer look. Each page takes the full width of the left column, one below the other, and the user scrolls down to see them. The cover title is drawn at its real size (in Grid it is drawn at half size). In this view the preview is not sticky, so every page can be reached by scrolling.

  Choosing an option changes the view immediately. It only changes how the preview looks, not the manual or the PDF.
* **Template** (next to Preview view): A group labeled "Template" with three options: **Template 1** (default), **Template 2** and **Template 3**. It changes where the content sits on every page, immediately. See `templates.md`.
* **Left column — Manual Preview**: A region labeled "Manual preview". It shows the manual's pages as small page thumbnails, in this order:
  1. **Cover**: shows the brand manual title with its style, the applied logo and "Designed by <name>", placed by the template (see `cover.md`). Each empty slot shows its placeholder: "Your brand manual title", "Your logo" and "Designed by …".
  2. **Logo**
  3. **Color palette**: shows the colors with their name, HEX, RGB and CMYK values (see `colorpalette.md`). Until the Colors section is touched, it shows the placeholder "Your color palette".
  4. **Typography**: shows the two brand fonts with their usage, name, "Aa" and alphabet (see `typography.md`). Until a font is changed, it shows the placeholder "Your typography".
  5. **Mockups**: the logo on up to 4 products (see `mockups.md`).

  (The Logo section fills four pages between the Cover and Color palette, so the manual has 8 pages: Cover, Brand concept, Anatomy, Logo versions, Clear space, Color palette, Typography, Mockups.)

  Pages whose section is not built yet show "Coming soon".
  The preview stays visible while the user scrolls the sections (sticky).
* **Right column — Manual Sections**: A region labeled "Manual sections". At the top, above the Cover section, the **Apply** button (see *Live Preview and Apply* below). Below it, the region lists every section needed to create the manual, one below the other, numbered, in this order:
  1. **Cover**: brand manual title, Designed by and logo (see `cover.md` and `titlefild.md`).
  2. **Logo**: "Coming soon".
  3. **Colors**: the brand's color palette (see `colorpalette.md`).
  4. **Typography**: the brand's primary and secondary fonts (see `typography.md`).
  5. **Skin**: the background and text colors of every page but the Cover, and decorative layers behind them that can be stacked, hidden, reordered and also drawn on the Cover (see `skins.md`).
  6. **Mockups**: up to 4 products showing the logo, each with its color and logo version (see `mockups.md`).

  Sections that are not built yet are shown disabled with the label "Coming soon", so the user can see the full path from the start.

### Opening and Folding Sections
The sections work as an **accordion**, like the colors of the Colors section (see `colorpalette.md`):
* The title of each built section (e.g. "1. Cover") is a button with an arrow. Clicking it **opens** the section's work area and folds the one that was open. Clicking the title of the open section folds it, leaving every section folded.
* Only **one** section is open at a time. The Page starts with **Cover** open.
* Sections not built yet ("Coming soon") can't be opened.
* A folded section keeps everything typed in it, and can't be reached with the keyboard or by screen readers (`inert`).
* **Logo scrolls on its own**: while open, the Logo section is at most as tall as the screen (minus 160px, never under 320px) and scrolls inside, so the page and the preview stay still. At its top or bottom, scrolling on carries on with the page. The other sections do not scroll on their own, because a scroll area would cut off their floating pop-ups (swatches, RGB, font lists).
* **Motion** (no bounce, `--ease-smooth`): the work area unfolds from no height to its full height, settling slowly, while its content fades in and glides down a few pixels; folding is the same in reverse, a little faster. The arrow turns with it, and the open section gets an accent border and a soft shadow.

### Live Preview and Apply
The sections have no Save buttons. Everything typed, picked or chosen in a section reaches the preview at once, except new images (see ADR 0007):
* Choosing a new or replacing image (the Cover logo, or any image of the Logo section) turns **Apply** on. The preview keeps the image it had (or its placeholder) until the user clicks Apply.
* Apply shows every image waiting in every section at once, then is disabled again. It is disabled from the start, and a wrong file never turns it on.
* It is only as wide as its label and sits on the right. When clicked, an accent ring pulses twice and a ✓ pops in next to "Apply" (decoration only: the accessible name stays "Apply").

### The Open Section's Pages Come First
So the page being edited is always in view without scrolling:
* Opening a section moves its pages to the **top** of the preview, at the same size as the others, and the rest follow in their natural order. Cover → Cover; Logo → Brand concept, Anatomy, Logo versions, Clear space; Colors → Color palette; Typography → Typography; Skin → Brand concept (the first page it paints; the Cover only gets the layers marked Also on the Cover); Mockups → Mockups.
* Folding the section puts every page back in its natural order. Opening another section moves that section's pages to the top instead.
* The pages glide softly to their new places, with no bounce: the same timing and easing as the accordion (about 0.5 s, `--ease-smooth`).
* The pages of the open section get an accent outline, and each page keeps its natural number in its caption (e.g. "7. Typography" while it is first).
* Apply has nothing to do with the order: it only shows waiting images.
* With Cover open (as on start) nothing moves, because Cover is already first.
* **Logo areas**: the Logo section has four areas, each with its page: Concept → Brand concept, Anatomy → Anatomy, Versions → Logo versions, Clear space & size → Clear space. The area being worked in decides the **main page**: it comes first, with the accent outline, followed by the other Logo pages. An area becomes the one being worked in when the user clicks anywhere in it (a field, its title or an empty spot) or reaches it with the keyboard. Scrolling inside Logo does not change it, so the form and the preview never move at the same time. When Logo opens, Concept is the first one.
* The open **section** moves too: it goes to the top of the right column (keeping its number, e.g. "4. Typography") and the column is pushed down so it starts at the same height as its page. The form and its page sit side by side. Folding it puts every section back in order. The sections glide like the pages. If the top of the column is above the screen when a section opens, the page scrolls smoothly up to it. On narrow screens (one column) the sections move but are not pushed down.

### Adding Sections
Sections and preview pages come from lists (`src/data/manualSections.ts`). When a section is built, it is marked as ready in the list and its form is plugged in; the layout does not change.

### Responsive
On screens narrower than `900px`, the two columns become one: the preview on top and the sections below (same order as on desktop).

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`).
* **Postconditions**: The Cover page of the preview shows what is typed in the Cover section, with the selected style, and the last applied logo.

## 4. Invariants
* The preview always shows every page of the manual, in the same order, whether they have content or not.
* The sections list always shows every section, in the same order, whether it is built or not.
* Every page of the preview changes as soon as its section changes. Only new images wait, for Apply.
* All the pages always share the same orientation.
* The chosen orientation is kept when the user moves between pages. It is only reset (to Portrait) when the browser page is refreshed.
* Every view always shows the same pages, in the same order, with the same orientation.
* The chosen preview view is kept when the user moves between pages. It is only reset (to Grid) when the browser page is refreshed.

## Failure Modes
* **Nothing typed yet**: The Cover shows the placeholders "Your brand manual title", "Your logo" and "Designed by …" instead of an empty page.

## 5. Given-When-Then Test Criteria

### Scenario 1: Page Layout
* **Given**: The user opens the Brand Manual page.
* **When**: The page loads.
* **Then**: The "Manual preview" region comes first (left) and the "Manual sections" region comes second (right).

### Scenario 2: All Sections Listed
* **Given**: The user is on the Brand Manual page.
* **When**: The user looks at the sections column.
* **Then**: The sections Cover, Logo, Colors, Typography, Skin and Mockups are listed in that order, and only Logo shows "Coming soon".

### Scenario 3: All Pages Previewed
* **Given**: The user is on the Brand Manual page.
* **When**: The user looks at the preview column.
* **Then**: The pages Cover, Logo, Color palette and Typography are shown in that order.

### Scenario 4: Cover Shows the Title Live
* **Given**: The Cover shows "Your brand manual title".
* **When**: The user types "My Brand" and selects the "Blue" swatch in Typography color.
* **Then**: The Cover shows "My Brand" in blue at once, with no button.

### Scenario 5: Only New Images Wait for Apply
* **Given**: The user is on the Brand Manual page; Apply, above the Cover section, is disabled.
* **When**: The user chooses a logo in the Cover section.
* **Then**: Apply turns on, and the Cover still shows "Your logo" until the user clicks it.

### Scenario 6: Changing the Page Orientation
* **Given**: The user is on the Brand Manual page and Portrait is selected (default).
* **When**: The user selects Landscape.
* **Then**: Landscape is selected and all four page thumbnails become landscape

### Scenario 7: Orientation Is Kept Between Pages
* **Given**: The user selected Landscape.
* **When**: The user goes to Home and then back to Brand Manual.
* **Then**: Landscape is still selected and the pages are still landscape.

### Scenario 8: Changing the Preview View
* **Given**: The user is on the Brand Manual page and Grid is selected (default).
* **When**: The user selects Pages.
* **Then**: Pages is selected, the preview shows the four pages one below the other, in the same order and orientation

### Scenario 8b: Overview Shows Four Pages Per Row
* **Given**: The user is on the Brand Manual page and Grid is selected (default).
* **When**: The user selects Overview.
* **Then**: Overview is selected and the preview shows all the pages, in the same order and orientation, four per row

### Scenario 9: Preview View Is Kept Between Pages
* **Given**: The user selected Pages.
* **When**: The user goes to Home and then back to Brand Manual.
* **Then**: Pages is still selected.

### Scenario 10: Cover Open by Default
* **Given**: The user opens the Brand Manual page.
* **When**: The page loads.
* **Then**: Cover is open, Colors, Typography, Skin and Mockups are folded, and Logo ("Coming soon") can't be opened.

### Scenario 11: Opening Another Section
* **Given**: Cover is open.
* **When**: The user clicks "3. Colors".
* **Then**: Colors opens and Cover folds.

### Scenario 12: Folding Keeps the Work
* **Given**: The user typed "My Brand" in the Cover title.
* **When**: The user opens Typography and then opens Cover again.
* **Then**: The title field still shows "My Brand".

### Scenario 13: The Open Section's Page Comes First
* **Given**: The user is on the Brand Manual page, with Cover open and the pages in their natural order.
* **When**: The user opens Typography.
* **Then**: The Typography page is first in the preview, with an accent outline and the caption "7. Typography". Apply stays off.

### Scenario 14: Folding Puts the Pages Back
* **Given**: Colors is open and the Color palette page is first.
* **When**: The user folds Colors (clicks its title).
* **Then**: Every page glides back to its natural order.

### Scenario 15: Another Section Opens
* **Given**: Colors is open and the Color palette page is first.
* **When**: The user opens Typography.
* **Then**: The Typography page is first, followed by the other pages in their natural order (Cover second).

### Scenario 16: The Open Section Moves Beside Its Page
* **Given**: Cover is open.
* **When**: The user opens Typography.
* **Then**: "4. Typography" glides to the top of the sections column, at the same height as the Typography page at the top of the preview, so both are seen side by side. Folding it puts the sections back in their order.

### Scenario 17: The Logo Area Decides the Main Page
* **Given**: Logo is open, and Brand concept is the main page.
* **When**: The user clicks in "Version 1 name" (scrolling to Versions alone changes nothing).
* **Then**: Logo versions glides to the first place of the preview, with the accent outline, followed by Brand concept, Anatomy and Clear space.
