# Technical Specification: Clear Space

## 1. What it does
Part of the **Logo** section. The user sets the rules that protect the logo: what the base unit **X** measures, the **minimum sizes** for digital and print, and an optional **construction grid**. The **Clear space** page of the preview shows them as chapter 3 of the Logo section, as soon as they are typed.

## Out of Scope
Drawing the construction grid in the app (it is uploaded as an image). Clear space rules per version. Measuring X from the logo automatically.

## 2. Interface
### Form (area "Clear space & size" of the Logo section)
* **Unit X**: free text, the end of "which equals …". Starts as `the height of the letter X`.
* **Min digital size (px)**: a number greater than 0. Starts at `32`.
* **Min print size (mm)**: a number greater than 0. Starts at `15`.
* **Construction grid (optional)**: PNG, JPG, SVG or WebP, up to 5 MB. A new image waits for **Apply** (see `brandmanual.md` and ADR 0007).

### Clear space page
* Header: the brand name and the heading "Clear space".
* **3.1 Clear space**: a diagram with the logo inside a dashed frame and an "X" on each side, and the sentence "The logo must always be surrounded by a free area… Its width is measured with the base unit X, which equals {Unit X}."
* **3.2 Construction grid**: the uploaded grid, or a striped placeholder box; and a fixed sentence about keeping the proportions.
* **3.3 Minimum size**: "Digital media: The minimum size is {px} px high…" and "Print media: The minimum size is {mm} mm high…".
* The template's CSS decides where each block sits.

### Empty or wrong fields (live preview)
The page never shows a sentence with a gap or a wrong number:
* With Unit X empty, the sentence says `the height of the letter X`.
* While a size is half typed or wrong (empty, `0`, letters), the page keeps the **last valid size**, and the field shows its error.
* The diagram shows the image of the **Primary version** (see `logoversions.md`); with none, the **logo applied in the Cover section**; with neither, a striped box.
* Until the Logo section is touched, the page shows the placeholder `Your clear space`.

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`), in the Logo section.
* **Postconditions**: The Clear space page shows the unit, the last valid minimum sizes and the last applied grid.

## 4. Invariants
* The minimum sizes on the page are always numbers greater than 0.
* Text reaches the page at once; a new grid image only after Apply.
* The diagram always keeps the logo inside its frame, with X on every side, in every template, orientation and view.

## Failure Modes
No field is required. A wrong value is flagged at once, with a red border, and the page keeps what it had:
* **Size not a number greater than 0**: `"Enter a number greater than 0"`.
* **Grid not an image of an accepted type**: `"Use a PNG, JPG, SVG or WebP image"`.
* **Grid bigger than 5 MB**: `"The logo must be 5 MB or smaller"`.

## 5. Given-When-Then Test Criteria

### Scenario 1: Live Clear Space
* **Given**: The Logo section is open.
* **When**: The user types "the width of the symbol" in Unit X, `48` in Min digital size and `20` in Min print size.
* **Then**: The page shows "which equals the width of the symbol.", "The minimum size is 48 px high." and "The minimum size is 20 mm high." at once.

### Scenario 2: A Wrong Size
* **Given**: The page shows a digital minimum of 48 px.
* **When**: The user types `0` in Min digital size.
* **Then**: The field shows "Enter a number greater than 0", and the page still shows 48 px.

### Scenario 3: Empty Unit
* **Given**: Unit X is empty.
* **When**: The user looks at the page.
* **Then**: The sentence ends with "which equals the height of the letter X."

### Scenario 4: The Cover Logo in the Diagram
* **Given**: A Cover logo is applied, and Version 1 has no image.
* **When**: The user looks at the page.
* **Then**: The diagram shows the Cover logo inside the frame.

### Scenario 5: Construction Grid
* **Given**: No grid is uploaded, so 3.2 shows a striped box.
* **When**: The user chooses a grid image.
* **Then**: 3.2 keeps the striped box until the user clicks Apply, and then shows the grid.
