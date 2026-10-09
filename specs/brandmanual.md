# Technical Specification: Brand Manual Page Layout

## 1. What it does
Organizes the Brand Manual page in two columns: on the **left**, a live preview of how the manual's pages are being organized; on the **right**, all the sections used to create the manual, one below the other.

## Out of Scope
The content of the Logo, Colors and Typography sections (each one has its own future spec). Opening or closing sections (accordion). Zooming into a page of the preview.

## 2. Interface
### Layout
* **Column widths**: The columns are not the same width. The preview (left) is wider, about 60%, and the sections (right) are narrower, about 40% (`3fr` / `2fr`).
* **Page Orientation** (top of the left column, above the thumbnails): A group labeled "Page orientation" with two options:
  * **Portrait** (vertical): A4 standing, `210 × 297`. Selected by default.
  * **Landscape** (apaisado): A4 lying down, `297 × 210`.

  Choosing an option changes the shape of all four page thumbnails immediately (no Save needed). The chosen orientation is also the one the PDF export will use (Phase 4).
* **Preview View** (next to Page orientation): A group labeled "Preview view" with two options:
  * **Grid**: the four pages as small thumbnails in a 2 × 2 grid. Selected by default.
  * **Pages**: a closer look. Each page takes the full width of the left column, one below the other, and the user scrolls down to see them. The cover title is drawn at its real size (in Grid it is drawn at half size). In this view the preview is not sticky, so every page can be reached by scrolling.

  Choosing an option changes the view immediately (no Save needed). It only changes how the preview looks, not the manual or the PDF.
* **Left column — Manual Preview**: A region labeled "Manual preview". It shows the manual's pages as small page thumbnails, in this order:
  1. **Cover**: shows the saved brand title with its style. Before a title is saved, it shows the placeholder text "Your brand title".
  2. **Logo**
  3. **Color palette**
  4. **Typography**

  Pages whose section is not built yet show "Coming soon".
  The preview stays visible while the user scrolls the sections (sticky).
* **Right column — Manual Sections**: A region labeled "Manual sections". It lists every section needed to create the manual, one below the other, numbered, in this order:
  1. **Brand title**: the form described in `titlefild.md`.
  2. **Logo**: "Coming soon".
  3. **Colors**: "Coming soon".
  4. **Typography**: "Coming soon".

  Sections that are not built yet are shown disabled with the label "Coming soon", so the user can see the full path from the start.

### Adding Sections
Sections and preview pages come from lists (`src/data/manualSections.ts`). When a section is built, it is marked as ready in the list and its form is plugged in; the layout does not change.

### Responsive
On screens narrower than `900px`, the two columns become one: the preview on top and the sections below (same order as on desktop).

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`).
* **Postconditions**: After saving the brand title, the Cover page of the preview shows the title with the selected style.

## 4. Invariants
* The preview always shows the four pages, in the same order, whether they have content or not.
* The sections list always shows every section, in the same order, whether it is built or not.
* The brand title in the preview changes only when the user clicks Save (same rule as in `titlefild.md`). The page orientation is the exception: it changes immediately.
* All four pages always share the same orientation.
* The chosen orientation is kept when the user moves between pages. It is only reset (to Portrait) when the browser page is refreshed.
* Both views always show the same four pages, in the same order, with the same orientation.
* The chosen preview view is kept when the user moves between pages. It is only reset (to Grid) when the browser page is refreshed.

## Failure Modes
* **No title saved yet**: The Cover shows "Your brand title" instead of an empty page.

## 5. Given-When-Then Test Criteria

### Scenario 1: Page Layout
* **Given**: The user opens the Brand Manual page.
* **When**: The page loads.
* **Then**: The "Manual preview" region comes first (left) and the "Manual sections" region comes second (right).

### Scenario 2: All Sections Listed
* **Given**: The user is on the Brand Manual page.
* **When**: The user looks at the sections column.
* **Then**: The sections Brand title, Logo, Colors and Typography are listed in that order, and Logo, Colors and Typography show "Coming soon".

### Scenario 3: All Pages Previewed
* **Given**: The user is on the Brand Manual page.
* **When**: The user looks at the preview column.
* **Then**: The pages Cover, Logo, Color palette and Typography are shown in that order.

### Scenario 4: Cover Shows the Saved Title
* **Given**: The Cover shows "Your brand title", and the user types "My Brand" and selects Font color "Blue".
* **When**: The user clicks Save.
* **Then**: The Cover shows "My Brand" in blue.

### Scenario 5: Preview Waits for Save
* **Given**: The user is on the Brand Manual page.
* **When**: The user types "My Brand" without clicking Save.
* **Then**: The Cover still shows "Your brand title".

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

### Scenario 9: Preview View Is Kept Between Pages
* **Given**: The user selected Pages.
* **When**: The user goes to Home and then back to Brand Manual.
* **Then**: Pages is still selected.
