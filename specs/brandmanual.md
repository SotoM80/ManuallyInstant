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

  Choosing an option changes the shape of all four page thumbnails immediately (no Save needed). The chosen orientation is also the one the PDF export will use (Phase 4).
* **Preview View** (next to Page orientation): A group labeled "Preview view" with three options:
  * **Grid**: the four pages as small thumbnails in a 2 × 2 grid. Selected by default.
  * **Overview**: four pages per row, so many pages can be seen at once; when the manual has more pages they continue on the next rows. Each page looks like a Grid thumbnail drawn at half size. The preview stays sticky.
  * **Pages**: a closer look. Each page takes the full width of the left column, one below the other, and the user scrolls down to see them. The cover title is drawn at its real size (in Grid it is drawn at half size). In this view the preview is not sticky, so every page can be reached by scrolling.

  Choosing an option changes the view immediately (no Save needed). It only changes how the preview looks, not the manual or the PDF.
* **Template** (next to Preview view): A group labeled "Template" with three options: **Template 1** (default), **Template 2** and **Template 3**. It changes where the content sits on every page, immediately (no Save needed). See `templates.md`.
* **Left column — Manual Preview**: A region labeled "Manual preview". It shows the manual's pages as small page thumbnails, in this order:
  1. **Cover**: shows the saved brand manual title with its style, the logo and "Designed by <name>", placed by the template (see `cover.md`). Before the first Save, it shows the placeholders "Your brand manual title", "Your logo" and "Designed by …".
  2. **Logo**
  3. **Color palette**: shows the saved colors with their name, HEX, RGB and CMYK values (see `colorpalette.md`). Before the first Save, it shows the placeholder "Your color palette".
  4. **Typography**: shows the two brand fonts with their usage, name, "Aa" and alphabet (see `typography.md`). Before the first Save, it shows the placeholder "Your typography".

  Pages whose section is not built yet show "Coming soon".
  The preview stays visible while the user scrolls the sections (sticky).
* **Right column — Manual Sections**: A region labeled "Manual sections". It lists every section needed to create the manual, one below the other, numbered, in this order:
  1. **Cover**: brand manual title, Designed by and logo (see `cover.md` and `titlefild.md`).
  2. **Logo**: "Coming soon".
  3. **Colors**: the brand's color palette (see `colorpalette.md`).
  4. **Typography**: the brand's primary and secondary fonts (see `typography.md`).

  Sections that are not built yet are shown disabled with the label "Coming soon", so the user can see the full path from the start.

### Opening and Folding Sections
The sections work as an **accordion**, like the colors of the Colors section (see `colorpalette.md`):
* The title of each built section (e.g. "1. Cover") is a button with an arrow. Clicking it **opens** the section's work area and folds the one that was open. Clicking the title of the open section folds it, leaving every section folded.
* Only **one** section is open at a time. The Page starts with **Cover** open.
* Sections not built yet ("Coming soon") can't be opened.
* A folded section keeps everything typed in it, and can't be reached with the keyboard or by screen readers (`inert`).
* **Motion** (no bounce, `--ease-smooth`): the work area unfolds from no height to its full height, settling slowly, while its content fades in and glides down a few pixels; folding is the same in reverse, a little faster. The arrow turns with it, and the open section gets an accent border and a soft shadow.

### Adding Sections
Sections and preview pages come from lists (`src/data/manualSections.ts`). When a section is built, it is marked as ready in the list and its form is plugged in; the layout does not change.

### Responsive
On screens narrower than `900px`, the two columns become one: the preview on top and the sections below (same order as on desktop).

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`).
* **Postconditions**: After saving the Cover section, the Cover page of the preview shows the title with the selected style, the logo and "Designed by <name>".

## 4. Invariants
* The preview always shows the four pages, in the same order, whether they have content or not.
* The sections list always shows every section, in the same order, whether it is built or not.
* The Cover in the preview changes only when the user clicks Save (same rule as in `titlefild.md` and `cover.md`). The page orientation is the exception: it changes immediately.
* All four pages always share the same orientation.
* The chosen orientation is kept when the user moves between pages. It is only reset (to Portrait) when the browser page is refreshed.
* Both views always show the same four pages, in the same order, with the same orientation.
* The chosen preview view is kept when the user moves between pages. It is only reset (to Grid) when the browser page is refreshed.

## Failure Modes
* **Nothing saved yet**: The Cover shows the placeholders "Your brand manual title", "Your logo" and "Designed by …" instead of an empty page.

## 5. Given-When-Then Test Criteria

### Scenario 1: Page Layout
* **Given**: The user opens the Brand Manual page.
* **When**: The page loads.
* **Then**: The "Manual preview" region comes first (left) and the "Manual sections" region comes second (right).

### Scenario 2: All Sections Listed
* **Given**: The user is on the Brand Manual page.
* **When**: The user looks at the sections column.
* **Then**: The sections Cover, Logo, Colors and Typography are listed in that order, and only Logo shows "Coming soon".

### Scenario 3: All Pages Previewed
* **Given**: The user is on the Brand Manual page.
* **When**: The user looks at the preview column.
* **Then**: The pages Cover, Logo, Color palette and Typography are shown in that order.

### Scenario 4: Cover Shows the Saved Title
* **Given**: The Cover shows "Your brand manual title", and the user types "My Brand", selects the "Blue" swatch in Typography color and fills Designed by and Logo.
* **When**: The user clicks Save.
* **Then**: The Cover shows "My Brand" in blue.

### Scenario 5: Preview Waits for Save
* **Given**: The user is on the Brand Manual page.
* **When**: The user types "My Brand" without clicking Save.
* **Then**: The Cover still shows "Your brand manual title".

### Scenario 6: Changing the Page Orientation
* **Given**: The user is on the Brand Manual page and Portrait is selected (default).
* **When**: The user selects Landscape.
* **Then**: Landscape is selected and all four page thumbnails become landscape, without clicking Save.

### Scenario 7: Orientation Is Kept Between Pages
* **Given**: The user selected Landscape.
* **When**: The user goes to Home and then back to Brand Manual.
* **Then**: Landscape is still selected and the pages are still landscape.

### Scenario 8: Changing the Preview View
* **Given**: The user is on the Brand Manual page and Grid is selected (default).
* **When**: The user selects Pages.
* **Then**: Pages is selected, the preview shows the four pages one below the other, in the same order and orientation, without clicking Save.

### Scenario 8b: Overview Shows Four Pages Per Row
* **Given**: The user is on the Brand Manual page and Grid is selected (default).
* **When**: The user selects Overview.
* **Then**: Overview is selected and the preview shows all the pages, in the same order and orientation, four per row, without clicking Save.

### Scenario 9: Preview View Is Kept Between Pages
* **Given**: The user selected Pages.
* **When**: The user goes to Home and then back to Brand Manual.
* **Then**: Pages is still selected.

### Scenario 10: Cover Open by Default
* **Given**: The user opens the Brand Manual page.
* **When**: The page loads.
* **Then**: Cover is open, Colors and Typography are folded, and Logo ("Coming soon") can't be opened.

### Scenario 11: Opening Another Section
* **Given**: Cover is open.
* **When**: The user clicks "3. Colors".
* **Then**: Colors opens and Cover folds.

### Scenario 12: Folding Keeps the Work
* **Given**: The user typed "My Brand" in the Cover title.
* **When**: The user opens Typography and then opens Cover again.
* **Then**: The title field still shows "My Brand".
