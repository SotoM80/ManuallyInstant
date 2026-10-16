# Technical Specification: Color Palette (Colors Section)

## 1. What it does
The third section of the Brand Manual page is **Colors**. The user builds the brand's color palette: from **1 to 6 colors**, each one with a free-text **name** and a color chosen with the same picker as the Cover (see `colorpicker.md`). For every color the app calculates its **HEX**, **RGB** and **CMYK (approximate)** values. As the user edits, the **Color palette** page of the preview shows every color with its name and its three values. Where they sit on the page depends on the chosen template.

## Out of Scope
Changing the background or text colors of the pages (they belong to the Cover and the Skin, see `colorpicker.md` and `skins.md`). Reordering colors (drag and drop). Pantone or other color systems. Typing CMYK or RGB values to choose a color (CMYK is only shown, never typed). Accurate, color-managed CMYK (see ADR 0003). Warnings about similar or low-contrast colors. Saving the palette between sessions.

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

The section has no Save button: every change reaches the preview at once.

The form follows the visual rules of the Cover form (text aligned right).

### Accordion
* Only **one** color is open at a time. The others are folded into their header row, one under the other.
* Clicking the header of a folded color **opens** it and folds the one that was open. Clicking the header of the open color folds it, leaving every color folded.
* **Add color** opens the new color and folds the others.
* After **Remove**, every color is folded.
* Every color with an invalid HEX has a red border, even while folded.
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
The page shows the heading **"Color palette"** and, for each color in order: a **chip** filled with the color, its **name**, and its values `HEX`, `RGB` and `CMYK ≈`. At the bottom, a small note: **"CMYK values are approximate"**. The text uses the Skin's Page text color (Black until it is changed, see `skins.md`). The chip has a faint outline, so a color equal to the page background is still visible.

Until the Colors section is touched, the page shows the placeholder `Your color palette`. A color with an empty name shows its label (`Color 1`, `Color 2`…) on the page.

### Templates
```
Template 1               Template 2               Template 3
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│Color palette │         │Color palette │         │Color │███ Blue│
│ ██   ██   ██ │         │██ Blue  #1E..│         │palet-│    #1E.│
│Blue Red  Navy│         │██ Red   #E5..│         │te    │███ Red │
│#1E.. #E5.. … │         │██ Navy  #1A..│         │      │    #E5.│
│      note    │         │note          │         │note  │███ Navy│
└──────────────┘         └──────────────┘         └──────┴───────┘
```
* **Template 1**: heading at the top; colors as cards in a grid of up to 3 columns (chip on top, name and values below). Everything centered.
* **Template 2**: heading at the top; one color per row, chip on the left and the name and values next to it. Everything aligned left.
* **Template 3**: a side column on the left with the heading (top) and the CMYK note (bottom), a faint vertical line, and the colors in the wide column on the right, one per row (a wide chip, then the name and values). Text aligned left.

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`), in the Colors section.
* **Postconditions**: The Color palette page always shows every color with its name, HEX, RGB and CMYK values, placed by the current template.

## 4. Invariants
* The palette always has between 1 and 6 colors.
* The values shown in the form always match the color in its picker.
* The Color palette page changes at once with every edit in this section. Editing the Cover never changes the palette, and editing the palette never changes the Cover.
* While a HEX is half typed or not valid, the page keeps the last valid color.
* The page always shows the colors in the same order as the form.
* The palette is kept when the user moves between pages; refreshing the browser clears it.
* Colors work the same in every template, orientation and preview view, and always stay inside the page.

## Failure Modes
No field is required. A wrong value is flagged on blur or Enter, with a red border, and the page keeps the last valid color:
* **HEX not valid**: `"Enter a valid HEX color, like #1E88E5"` (as in `colorpicker.md`). An empty HEX is not an error.

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

### Scenario 5: Live Palette
* **Given**: The user is in the Colors section.
* **When**: The user names Color 1 "Primary blue" and picks `#1E88E5`.
* **Then**: The Color palette page shows at once, with no button, "Primary blue", `#1E88E5`, `30, 136, 229`, `87, 41, 0, 10` and "CMYK values are approximate".

### Scenario 6: Empty Name
* **Given**: Color 1 has no name.
* **When**: The user picks the "Blue" swatch.
* **Then**: The page shows "Color 1" with `#1E88E5`, and no error is shown.

### Scenario 7: Edits Show at Once
* **Given**: The page shows "Primary blue".
* **When**: The user renames it "Sky".
* **Then**: The page shows "Sky" at once.

### Scenario 8: Palette Is Kept Between Pages
* **Given**: The page shows a color named "Primary blue".
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

### Scenario 11: An Invalid HEX Is Marked
* **Given**: Color 1 shows `#1E88E5` on the page.
* **When**: The user types `blue` in its HEX field and leaves it.
* **Then**: The field shows "Enter a valid HEX color, like #1E88E5", the card has a red border, and the page keeps `#1E88E5`.
