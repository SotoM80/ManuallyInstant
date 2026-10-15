# Technical Specification: Clear Space

## 1. What it does
Part of the **Logo** section. The user sets the rules that protect the logo: what the base unit **X** measures, the **minimum sizes** for digital and print, and an optional **construction grid**. The **Clear space** page of the preview shows them as chapter 3 of the Logo section, as soon as they are typed.

## Out of Scope
Detecting the shapes of the logo (circles, angles) or measuring its proportions (e.g. "1.5X"): the app has no image recognition (ADR 0002). Clear space rules per version.

## 2. Interface
### Form (area "Clear space & size" of the Logo section)
* **Unit X**: free text, the end of "which equals …". Starts as `the height of the letter X`.
* **Min digital size (px)**: a number greater than 0. Starts at `32`.
* **Min print size (mm)**: a number greater than 0. Starts at `15`.
* **Construction grid (optional)**: PNG, JPG, SVG or WebP, up to 5 MB. A new image waits for **Apply** (see `brandmanual.md` and ADR 0007).
* **Remove grid**: shown once a grid is chosen. It removes the uploaded grid at once (no Apply: it is not a new image), so 3.2 goes back to the grid drawn by the app.
* **Grid modules**: **12**, **16** or **24**, with one always chosen (default **16**): how many squares fit across the logo in the grid the app draws when none is uploaded. It changes the grid at once (no Apply). It is turned off while an uploaded grid is shown, since it has nothing to change then.
* **X (modules)**: **1**, **1.5**, **2** or **3**, with one always chosen (default **1**): how many modules X measures. It sets the free area of 3.1 and the margin of the grid in 3.2, so X is the same measure in both blocks. It changes them at once (no Apply).
* **Top ruler** and **Side ruler**: optional sequences of steps in X, separated by spaces, e.g. `X 1.5X X 1.5X X` (a step is an optional number, with a point or a comma, followed by X). Empty → no ruler.
* A short note under Grid modules says where 3.2 comes from: `Drawn from your logo (Cover or Version 1). No upload needed.`, `Click Apply to show this grid instead of the one drawn from your logo.` (a grid is chosen but not applied) or `Your uploaded grid is shown. Remove it to use the grid drawn from your logo.`

### Clear space page
* Header: the brand name and the heading "Clear space".
* **3.1 Clear space**: a diagram drawn in the same modules as the grid of 3.2: the visible part of the logo (its transparent margins are ignored), X of free room on every side, the dashed edge of that area and an "X" on each side. Then the sentence "The logo must always be surrounded by a free area… Its width is measured with the base unit X, which equals {Unit X}."
* **3.2 Construction grid**: a fixed sentence about keeping the proportions, and one of these, in this order:
  1. The **uploaded** grid.
  2. A grid **drawn by the app** over the Primary logo (the same image as 3.1): square modules fitted to the visible part of the logo (its transparent margins are ignored), *Grid modules* squares wide, with X of margin on every side. The logo is faded so the grid over it can be read. The logo's box is a dashed line, and X is marked with a small dimension line at the top. With rulers, a dimension line runs above the grid (Top ruler) and beside it (Side ruler), starting at the logo's edges: each step is drawn `value × X` long with its label ("X", "1.5X"), and a faint dashed guide crosses the grid at every step. Changing X makes the rulers grow or shrink with it. A ruler longer than the grid is still drawn whole. Lines use the Typography color.
  3. A striped placeholder box, when there is no logo at all.
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
* **A ruler step that is not like X, 1.5X or 2X**: `"Use steps like X, 1.5X or 2X, separated by spaces"`. The grid keeps the last valid ruler.

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

### Scenario 5: Uploaded Construction Grid
* **Given**: No grid is uploaded, so 3.2 shows a striped box.
* **When**: The user chooses a grid image.
* **Then**: 3.2 keeps the striped box until the user clicks Apply, and then shows the grid.

### Scenario 6: Grid Drawn by the App
* **Given**: A Cover logo is applied and no grid is uploaded.
* **When**: The user looks at the page.
* **Then**: 3.2 shows the logo under a grid 16 modules wide, fitted to the drawn part of the logo, with one module of margin and X marked at the top.

### Scenario 7: Grid Density
* **Given**: 3.2 shows the grid drawn by the app.
* **When**: The user chooses **24** in Grid modules.
* **Then**: The grid is 24 modules wide at once, and the logo keeps its size on the page.

### Scenario 8: The Uploaded Grid Wins
* **Given**: 3.2 shows the grid drawn by the app.
* **When**: The user uploads a grid image and clicks Apply.
* **Then**: 3.2 shows the uploaded image instead.

### Scenario 9: Removing the Uploaded Grid
* **Given**: 3.2 shows an uploaded grid.
* **When**: The user clicks **Remove grid**.
* **Then**: 3.2 shows the grid drawn by the app at once, and the Remove grid button disappears.

### Scenario 10: One X for Both Blocks
* **Given**: A Cover logo is applied, and X is 1 module.
* **When**: The user chooses **3** in X (modules).
* **Then**: The free area around the logo in 3.1 and the margin of the grid in 3.2 both grow to three modules at once, and the X marked in 3.2 is three modules long.

### Scenario 11: Rulers in X
* **Given**: 3.2 shows the grid drawn by the app, with X = 1 module.
* **When**: The user types `X 1.5X X 1.5X X` in Top ruler and `X 1.5X X` in Side ruler.
* **Then**: A dimension line with the labels "X 1.5X X 1.5X X" runs above the grid from the logo's left edge, another with "X 1.5X X" runs beside it from the logo's top, and faint guides cross the grid at every step.

### Scenario 12: Rulers Follow X
* **Given**: The side ruler is `X 1.5X` (2.5 modules long with X = 1).
* **When**: The user chooses **2** in X (modules).
* **Then**: The side ruler is 5 modules long, with the same labels.

### Scenario 13: A Wrong Step
* **Given**: The top ruler is `X 2X`.
* **When**: The user changes it to `X 2Y`.
* **Then**: The field shows "Use steps like X, 1.5X or 2X, separated by spaces", and the grid keeps "X 2X".
