# Technical Specification: Color Palette (Colors Section)

## 1. What it does
The third section of the Brand Manual page is **Colors**. The user builds the brand's color palette: from **1 to 6 colors**, each one with a free-text **name** and a color chosen with the same picker as the Cover (see `colorpicker.md`). For every color the app calculates its **HEX**, **RGB** and **CMYK (approximate)** values. After the user clicks Save, the **Color palette** page of the preview shows every color with its name and its three values. Where they sit on the page depends on the chosen template.

## Out of Scope
Changing the Typography or Background colors of the manual (they belong to the Cover, see `colorpicker.md`). Reordering colors (drag and drop). Pantone or other color systems. Typing CMYK or RGB values to choose a color (CMYK is only shown, never typed). Accurate, color-managed CMYK (see ADR 0003). Warnings about similar or low-contrast colors. Saving the palette between sessions.

## 2. Interface
### Section form (inside "3. Colors")
The form has one block per color, in order (Color 1, Color 2, …), then the buttons. The blocks work as an **accordion** (see below): each one has a header row that is always shown, and a body with its fields that is shown only while it is open.

**Header row** (a button labeled `Color N`): the color as a small chip, `Color N`, the color's name (or `No name yet`) and its HEX (or `—` while it is not valid), and an arrow that points down when folded and up when open.

**Body** (only while open):
1. **Name**: a text field labeled `Color N name` (e.g. "Primary blue").
2. **Color**: a color picker labeled `Color N`, exactly like the Cover pickers (swatches, custom, HEX field and RGB pop-up, same HEX rules).
3. **Values**: the color's values as text, always matching the picker: `HEX #1E88E5`, `RGB 30, 136, 229` and `CMYK ≈ 87, 41, 0, 10`. While the HEX is not valid, the values show `—`.
4. **Remove** button (labeled `Remove Color N`). It is not shown while there is only one color.

Under the blocks:
* **Add color** button: adds a new block at the end. It is disabled when the palette has 6 colors.
* **Save** button.

The form follows the visual rules of the Cover form (text aligned right, Save button only as wide as its label).

### Accordion
* Only **one** color is open at a time. The others are folded into their header row, one under the other.
* Clicking the header of a folded color **opens** it and folds the one that was open. Clicking the header of the open color folds it, leaving every color folded.
* **Add color** opens the new color and folds the others.
* After **Remove**, every color is folded.
* On a **Save** with errors, the first color with an error opens so its error can be seen; every color with an error has a red border, even while folded.
* **Motion** (same style as the color picker pop-ups, no bounce): the body unfolds from no height to its full height, fast at first and settling slowly (`--ease-smooth`, about 0.5 s), while its fields fade in and glide down a few pixels. Folding is the same motion in reverse, a little faster. The arrow turns with it, and the open color's card gets an accent border and a soft shadow.
* A folded body can't be reached with the keyboard or by screen readers (`inert`).

### Defaults
* The section starts with **one** color, open, with an empty name.
* Every new color (the first one too) starts at the first quick swatch that is not already used in the palette, in the order of `colorpicker.md` (Black, White, Gray, …).
* Numbers are positions: after removing Color 2, the old Color 3 becomes Color 2.

### CMYK calculation
From RGB with the naive formula of ADR 0003: `K = 1 − max(R′, G′, B′)`, then `C = (1 − R′ − K) / (1 − K)` (same for M with G′ and Y with B′), where `R′ = R / 255`. Pure black is `0, 0, 0, 100`. Values are percentages rounded to whole numbers.

| HEX | RGB | CMYK ≈ |
|---|---|---|
| `#1E88E5` | `30, 136, 229` | `87, 41, 0, 10` |
| `#000000` | `0, 0, 0` | `0, 0, 0, 100` |
| `#FFFFFF` | `255, 255, 255` | `0, 0, 0, 0` |

### Color palette page in the preview
The page shows the heading **"Color palette"** and, for each saved color in order: a **chip** filled with the color, its **name**, and its values `HEX`, `RGB` and `CMYK ≈`. At the bottom, a small note: **"CMYK values are approximate"**. The text uses the Cover's Typography color (Black until the Cover is saved). The chip has a faint outline, so a color equal to the page background is still visible.

Before the first Save the page shows the placeholder `Your color palette`.

### Templates
```
Template 1               Template 2               Template 3
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│Color palette │         │Color palette │         │ Color palette│
│ ██   ██   ██ │         │██ Blue  #1E..│         │──────────────│
│Blue Red  Navy│         │██ Red   #E5..│         │ ██ │ ██ │ ██ │
│#1E.. #E5.. … │         │██ Navy  #1A..│         │ ██ │ ██ │ ██ │
│      note    │         │note          │         │Blue│ Red│Navy│
└──────────────┘         └──────────────┘         └──────────────┘
```
* **Template 1**: heading at the top; colors as cards in a grid of up to 3 columns (chip on top, name and values below). Everything centered.
* **Template 2**: heading at the top; one color per row, chip on the left and the name and values next to it. Everything aligned left.
* **Template 3**: heading at the top with a thin divider line under it; colors as tall columns side by side (chip on top, name and values below). Text aligned right.

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`), in the Colors section.
* **Postconditions**: After a valid Save, the Color palette page shows every color with its name, HEX, RGB and CMYK values, placed by the current template.

## 4. Invariants
* The palette always has between 1 and 6 colors.
* The values shown in the form always match the color in its picker.
* The Color palette page changes only when the user clicks this section's Save. Saving the Cover never changes the palette, and saving the palette never changes the Cover.
* The page always shows the colors in the same order as the form.
* The saved palette is kept when the user moves between pages; refreshing the browser clears it.
* Colors work the same in every template, orientation and preview view, and always stay inside the page.

## Failure Modes
On Save, every invalid field shows its error at the same time, with a red border, and nothing is saved:
* **Name empty** (or only spaces): `"Required field"`.
* **HEX empty**: `"Required field"`.
* **HEX not valid**: `"Enter a valid HEX color, like #1E88E5"` (also shown on blur or Enter, as in `colorpicker.md`).

## 5. Given-When-Then Test Criteria

### Scenario 1: One Color by Default
* **Given**: The user opens the Brand Manual page.
* **When**: The user looks at the Colors section.
* **Then**: It shows one color block, "Color 1", open, with an empty name, HEX `#000000`, no Remove button, and the Color palette page shows "Your color palette".

### Scenario 2: Values Follow the Picker
* **Given**: The user is in the Colors section.
* **When**: The user picks the "Blue" swatch for Color 1.
* **Then**: The values show `HEX #1E88E5`, `RGB 30, 136, 229` and `CMYK ≈ 87, 41, 0, 10`.

### Scenario 3: Adding and Removing Colors
* **Given**: The palette has one color.
* **When**: The user clicks Add color twice, then opens Color 2 and removes it.
* **Then**: There are two colors, Color 1 (Black) and Color 2 (the old Color 3, Gray).

### Scenario 4: Six Colors at Most
* **Given**: The palette has five colors.
* **When**: The user clicks Add color.
* **Then**: There are six colors and Add color is disabled.

### Scenario 5: Saving the Palette
* **Given**: Color 1 is named "Primary blue" with `#1E88E5`.
* **When**: The user clicks the Colors Save.
* **Then**: The Color palette page shows "Primary blue", `#1E88E5`, `30, 136, 229`, `87, 41, 0, 10` and "CMYK values are approximate".

### Scenario 6: Required Name
* **Given**: Color 1 has no name.
* **When**: The user clicks the Colors Save.
* **Then**: The name field shows "Required field" with a red border, and the page still shows "Your color palette".

### Scenario 7: Palette Waits for Save
* **Given**: The user saved a palette with "Primary blue".
* **When**: The user renames it "Sky" without clicking Save.
* **Then**: The page still shows "Primary blue".

### Scenario 8: Palette Is Kept Between Pages
* **Given**: The user saved a palette with "Primary blue".
* **When**: The user goes to Home and then back to Brand Manual.
* **Then**: The Color palette page still shows "Primary blue".

### Scenario 9: Adding Opens the New Color
* **Given**: The palette has one color, open.
* **When**: The user clicks Add color twice.
* **Then**: Color 3 is open, and Color 1 and Color 2 are folded, one under the other.

### Scenario 10: Opening Another Color
* **Given**: Color 3 is open, and Color 1 and Color 2 are folded.
* **When**: The user clicks the header of Color 2.
* **Then**: Color 2 opens, Color 3 folds, and Color 1 stays folded.

### Scenario 11: An Error Opens Its Color
* **Given**: Color 1 has a name, Color 2 has no name, and Color 1 is open.
* **When**: The user clicks the Colors Save.
* **Then**: Color 2 opens and shows "Required field", its card has a red border, and the page does not change.
