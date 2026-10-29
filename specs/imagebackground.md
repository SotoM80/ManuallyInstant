# Technical Specification: Background per Image

## 1. What it does
Every image of the logo shown in a box on the inner pages can have its own **background color**: each card and part of the Anatomy page, each version of the Logo versions page, and each example of the Usage pages. The Clear space page uses the background of Version 1. The color is chosen in the same section as the image, in a folded **More** area under its image field. By default there is **no background**, and the pages look as before (ADR 0021).

## Out of Scope
* A background for the Cover logo, the Brand concept logo or the mockups (they have no box, or their own color: the Cover's Background, a mockup's product color).
* One background color for every box at once (a Skin setting).
* The corner radius, inner margin and outline of the boxes (see `imageboxes.md`, a later feature).
* Gradients, transparency or images as a background.
* Checking that the logo shows on its background, or picking a color from the image.
* Changing the outline or the empty-box stripes to suit a dark background.

## 2. Interface

### The More area
Under each image field listed below there is a **More** button that folds and unfolds an area with the image's **Background** field. It starts folded, every time the form is opened, and does not fold other areas.
* The button reads "More", with an arrow that turns like the accordions' arrows. Its accessible name is `More for <field label>`, e.g. `More for Version 1 image`, and it has `aria-expanded`.
* A folded area cannot be reached with the keyboard or by screen readers (`inert`), like a folded accordion block.

| Section | Image field | Background label |
|---|---|---|
| Logo → Anatomy | each card's image (`Isotype image`, …) | `Isotype background`, … |
| Logo → Anatomy | each part's image (`Imagotype part 1 image`, …) | `Imagotype part 1 background`, … |
| Logo → Versions | `Version N image` | `Version N background` |
| Usage | `Correct use example N image`, `Incorrect use example N image` | `Correct use example N background`, … |

### The Background field
The Skin's color field (`SkinColorField`, see `skins.md`), with one more chip before the palette chips:
* **No background**: chosen by default. Its accessible name is `<Background label>: none`, e.g. `Version 1 background: none`. It removes the color.
* The quick swatches, the custom color, the HEX field and the RGB pop-up of the color picker (`colorpicker.md`).
* One chip per palette color, which copies it (`<Background label>: use <color name>`), as in the Skin.

While a HEX is half typed or not valid, the page keeps the last valid choice (a color, or no background). A wrong HEX is flagged on blur or Enter, with the usual message. The color reaches the page at once: there is no Apply (ADR 0007); only a new image waits for its Apply (ADR 0020).

### The pages
* **Anatomy, Logo versions, Usage**: the box of the image (`figure.logo-figure`) is filled with its background. An empty box (no image yet) is filled too, with its stripes on top. The Usage mark (✓ / ✕) keeps its white circle.
* **Clear space**, with the background of **Version 1**:
  * **3.1**: the clear space area, inside the dashed edge (the logo and X on every side), is filled. The rest of the block is not.
  * **3.2**: the whole box of the construction grid is filled, with the grid (drawn or uploaded) on top.
* Version 1 with no image shows the Cover's logo (`logoversions.md`): its background still applies.
* The background is the same in the preview, the full screen view and both PDFs, in every template and orientation.
* The Cover, Brand concept, Color palette, Typography and Mockups pages do not change. A mockup that shows a version shows its image, not its background.

### In the code
* `src/types.ts`: `background: string | null` (`"#RRGGBB"` or none) on `MarkCard`, `MarkPart`, `LogoVariant` and `UsageExample`.
* `src/components/SkinColorField.tsx`: a new `allowNone` prop; with it, `value` may be `null` and the No background chip is shown.
* `LogoForm.tsx` and `UsageForm.tsx` keep the background of each card, part, version and example, and send it with the rest of the data.
* `AnatomyPage.tsx`, `LogoVersionsPage.tsx`, `UsagePage.tsx`, `ClearSpacePage.tsx` and `ClearSpaceDiagram.tsx` paint it.

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`), in the Logo or Usage section.
* **Postconditions**: Each box shows its image (or its empty stripes) on its background, or on the page when it has none.

## 4. Invariants
* With no background chosen anywhere, every page looks exactly as before.
* Each background belongs to one image: changing it never changes another box.
* The background is kept when its image is replaced, applied or removed, and when its card's mark type is unticked and ticked again. It is gone with its version, part or example.
* Folding or unfolding More never changes the manual.
* Every background is a valid `#RRGGBB` or none.

## Failure Modes
* **HEX not valid**: `"Enter a valid HEX color, like #1E88E5"` on blur or Enter (as in `colorpicker.md`); the page keeps the last valid choice. An empty HEX is not an error.

## 5. Given-When-Then Test Criteria

### Scenario 1: No Background by Default
* **Given**: The user opens the Logo section.
* **When**: The user unfolds More under Version 1 image.
* **Then**: "Version 1 background: none" is chosen, and the Logo versions page has no background on any box.

### Scenario 2: A Version on Black
* **Given**: Version 2 has an applied image.
* **When**: The user unfolds More for Version 2 image and types `#000000` in Version 2 background.
* **Then**: The box of Version 2 on the Logo versions page is black at once, with no Apply; the box of Version 1 does not change.

### Scenario 3: Back to No Background
* **Given**: Version 2 background is `#000000`.
* **When**: The user clicks "Version 2 background: none".
* **Then**: The box of Version 2 has no background again.

### Scenario 4: A Palette Color
* **Given**: The palette has "Primary blue", `#1E88E5`.
* **When**: The user clicks "Correct use example 1 background: use Primary blue".
* **Then**: The first example on the Correct use page has a `#1E88E5` background, and its ✓ mark keeps its white circle.

### Scenario 5: Anatomy Cards and Parts
* **Given**: The Imagotype card has two parts.
* **When**: The user gives the card `#FFD600` and part 2 `#1A237E`.
* **Then**: On the Anatomy page the whole mark has a `#FFD600` box, part 2 a `#1A237E` box, and part 1 no background.

### Scenario 6: Clear Space Uses Version 1
* **Given**: The Clear space page shows the Primary logo.
* **When**: The user gives Version 1 a `#000000` background.
* **Then**: In 3.1 the area inside the dashed edge is black, and in 3.2 the box of the grid is black, with the grid on top.

### Scenario 7: An Empty Box
* **Given**: Version 3 has no image.
* **When**: The user gives it a `#E53935` background.
* **Then**: The empty box of Version 3 is red, with its stripes on top.

### Scenario 8: Half Typed HEX
* **Given**: Version 1 background is `#000000`.
* **When**: The user types `#12` in its HEX field.
* **Then**: The box stays black; on blur, the field shows "Enter a valid HEX color, like #1E88E5".

### Scenario 9: Kept With the Image
* **Given**: Version 1 has a black background and an applied image.
* **When**: The user chooses and applies another image for Version 1.
* **Then**: The new image is shown on the same black background.

### Scenario 10: Mockups Do Not Change
* **Given**: The Mug shows Version 2, and Version 2 has a black background.
* **When**: The user looks at the Mockups page.
* **Then**: The Mug shows the Version 2 image on its product color, with no black box.

### Scenario 11: More Starts Folded
* **Given**: The user opens the Usage section.
* **When**: The user looks at Correct use example 1.
* **Then**: "More for Correct use example 1 image" is folded (`aria-expanded="false"`), and its Background field cannot be reached with the keyboard until it is unfolded.

### Scenario 12: The Same in the PDF
* **Given**: Version 2 has a black background.
* **When**: The user downloads the web PDF.
* **Then**: The Logo versions page of the PDF shows the Version 2 box black, as in the preview.
