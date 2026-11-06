# Technical Specification: Section Backgrounds

## 1. What it does
Each section of the manual (**Cover, Logo, Usage, Colors, Typography, Mockups**) can have its own **background**: a **color**, and a **picture** of the user's with its **Fit** and its **opacity**. Every page of the section shows it: the Logo's on Brand concept, Anatomy, Logo versions and Clear space; the Usage's on Correct use and Incorrect use. It is set in a folded **Section background** group at the end of that section's form.

A section background replaces only the Skin's **Page background**. The Skin's layers are still drawn over it, and the text keeps the Skin's **Page text** color (`skins.md`). With nothing set, a section's pages look exactly as before (ADR 0025).

The **Cover** keeps its own Background color (`colorpicker.md`, ADR 0011): its group has the picture, Fit and opacity only.

## Out of Scope
* A background per page (the 4 Logo pages share one, and so do the 2 Usage pages). A background for the Skin section (it has no page of its own).
* A text color per section, or a warning about low contrast between the background and the Page text.
* Turning off the Skin's layers on one section. Changing the order (the picture is always under the Skin's layers).
* A transparent color: the color is solid; only the picture has an opacity.
* Moving, zooming, cropping or tinting the picture (only Cover or Contain). More than one picture per section. Gradients as a section background (use a Skin layer).
* Copying a section background to other sections.

## 2. Interface

### The Section background group
At the end of the Cover, Logo, Usage, Colors, Typography and Mockups forms there is a **Section background** button that folds and unfolds the group. It starts folded every time the form is opened. Its accessible name is `<Section> section background` (e.g. `Logo section background`) and it has `aria-expanded`. A folded group cannot be reached with the keyboard or by screen readers (`inert`), like the More area of `imagebackground.md`.

```
▸ Section background                         ← folded

▾ Section background
    Logo background color   (Skin's) [●] [●] [●] … [●] #______   ← not on the Cover
    Logo background image   [ Choose file ]  [ Apply ]  [ Remove ]
    Fit                     [ Cover | Contain ]
    Opacity                 ────────●── 100 %
```

**Color** (`<Section> background color`, e.g. `Colors background color`), not on the Cover: the Skin's color field (`SkinColorField`, see `skins.md`), with one more chip before the palette chips:
* **Skin's**: chosen by default. Its accessible name is `<Section> background color: Skin's`. The section uses the Skin's Page background, and follows it when it changes.
* The quick swatches, custom color, HEX field and RGB pop-up of the color picker (`colorpicker.md`), then one chip per palette color, which copies it (ADR 0011).
* A HEX is used once it is valid; a wrong one is flagged on blur or Enter with `"Enter a valid HEX color, like #1E88E5"`, and the pages keep the last valid choice. An empty HEX is not an error.

**Image** (`<Section> background image`): an image field (PNG, JPG, SVG or WebP, up to 5 MB, as in `cover.md`) with its own **Apply** next to it (`Apply <Section> background image`, ADR 0020) and a **Remove** button (`Remove <Section> background image`) once a picture is applied. A new file waits for Apply; a wrong file is flagged at once (`"Use a PNG, JPG, SVG or WebP image"`, `"The image must be 5 MB or smaller"`) and never turns Apply on. Remove takes the applied picture off the pages at once.

**Fit**: a segmented control (`<Section> background fit: Cover`, `<Section> background fit: Contain`), **Cover** (default: the picture fills the page, cropped to it, centered) or **Contain** (the whole picture, centered; the color shows around it), as the Skin's Image layer.

**Opacity** (`<Section> background opacity`): a slider 5–100 %, step 5, default **100 %**, with its value next to it. At 100 % the picture hides the color; lower, the color shows through it. It keeps its value with no picture.

Color, Fit and Opacity are live; only a new picture waits for its Apply (ADRs 0007 and 0020).

### On the pages
Every page of the section, from back to front:
1. The section **color**, or the Skin's Page background when it is **Skin's** (on the Cover: the Cover's Background color).
2. The section **picture**, with its Fit and opacity, as an SVG `<image>` the size of the page in mm (`preserveAspectRatio` `xMidYMid slice` for Cover, `meet` for Contain), clipped to the page, `aria-hidden="true"`, `pointer-events: none`.
3. The Skin's layers (on the Cover, only the ones marked Also on the Cover), as before.
4. The content, in the Page text color (on the Cover, its own colors).

The page order, templates, orientation, views (grid, list, full screen) and the guide bands of the Clear space page work as before.

### In the PDF
Both PDFs draw the section backgrounds as the preview does. Before drawing, the export waits for every applied section picture to load and checks that it can be read, as it does for the Skin's pictures; if one cannot, no PDF is made and `The PDF could not be created. Try again.` is shown (`export.md`). A full-page photo makes the print PDF much heavier (ADR 0023).

### In the code
* `src/skins/types.ts`: `SectionBackground = { color: string | null; image: UploadedImage | null; fit: ImageFit; opacity: number }` (`color: null` → Skin's), `SectionId = 'cover' | 'logo' | 'usage' | 'colors' | 'typography' | 'mockups'`, and the Skin's new field `sections: Partial<Record<SectionId, SectionBackground>>` (`NO_SKIN` has none). The Skin already reaches every place a page is drawn (preview, full screen, PDF), so nothing new is passed down.
* `src/data/manualSections.ts`: the section of each page, read from `SECTION_PAGES` (without the Skin entry).
* `src/components/SectionBackgroundField.tsx`: the folded group, used by the six forms through `BrandManualPage`, which changes only `skin.sections[id]`, always from the newest skin. The file waiting for Apply stays in the field while the section is open, like the Skin's Image layer.
* `ManualPage.tsx`: paints the section color; `SkinBackdrop` draws the section picture as the lowest group of its SVG, under the layers.
* `src/export/skinPictures.ts`: its check already covers every `<image>` of that SVG, so the section pictures too.

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`), in one of the six sections.
* **Postconditions**: Every page of the section shows its color (or the Skin's Page background), its applied picture at its opacity, then the Skin's layers and the content.

## 4. Invariants
* With no section background set anywhere, every page looks exactly as before.
* A section background only paints the pages of its section, and never changes the Skin, the Page text or another section.
* The Skin's layers are always drawn over the section picture; the content is never faded.
* The Cover's Background color is only set in the Cover's colors (ADR 0011).
* Section backgrounds are kept when the template, orientation, view or page order change, and when the user goes to Home and back. Nothing is saved between sessions.
* Every color is a valid `#RRGGBB` or Skin's; every opacity is 5–100 in steps of 5.

## Failure Modes
* **HEX not valid**: `"Enter a valid HEX color, like #1E88E5"` on blur or Enter; the pages keep the last valid choice.
* **Wrong file**: `"Use a PNG, JPG, SVG or WebP image"` or `"The image must be 5 MB or smaller"`; Apply stays off and the pages do not change.
* **A picture that cannot be read at export**: `The PDF could not be created. Try again.`; no PDF is made.

## 5. Given-When-Then Test Criteria

### Scenario 1: Nothing Set by Default
* **Given**: A new manual with a Skin whose Page background is `#F5F5F5`.
* **When**: The user opens the Colors section and unfolds Section background.
* **Then**: The color is on `Skin's`, there is no picture, Fit is Cover and Opacity is 100 %; the Color palette page is painted `#F5F5F5`, as before.

### Scenario 2: A Section Color
* **Given**: The Colors section, with no section background.
* **When**: The user sets `Colors background color` to `#111111`.
* **Then**: The Color palette page is painted `#111111` at once; every other page keeps the Skin's Page background; the text keeps the Page text color.

### Scenario 3: Every Page of the Section
* **Given**: The Logo section.
* **When**: The user sets `Logo background color` to Blue (`#1E88E5`).
* **Then**: Brand concept, Anatomy, Logo versions and Clear space are painted Blue; the Usage pages are not.

### Scenario 4: Back to the Skin's
* **Given**: `Colors background color` is `#111111`.
* **When**: The user chooses the `Skin's` chip, then changes the Skin's Page background to `#FFF8E1`.
* **Then**: The Color palette page is painted `#FFF8E1`.

### Scenario 5: The Picture Waits for Apply
* **Given**: The Mockups section.
* **When**: The user chooses `studio.jpg` in `Mockups background image`.
* **Then**: The pages do not change until `Apply Mockups background image`; then the Mockups page draws `studio.jpg` over the whole page, at 100 % opacity, under the Skin's layers, and Apply is off again.

### Scenario 6: Opacity
* **Given**: The Mockups page with `studio.jpg` applied and `Mockups background color` `#000000`.
* **When**: The user sets the opacity to 40 %.
* **Then**: The picture is drawn at 0.4 opacity over the black color; the mockups and their texts are not faded.

### Scenario 7: Fit Contain
* **Given**: A tall picture applied to the Typography section, color `#EEEEEE`.
* **When**: The user chooses Contain.
* **Then**: The whole picture is drawn centered on the Typography page, with `#EEEEEE` around it.

### Scenario 8: Removing the Picture
* **Given**: A picture applied to the Usage section, opacity 60 %.
* **When**: The user presses `Remove Usage background image`.
* **Then**: Correct use and Incorrect use show only their color at once; the opacity stays at 60 %.

### Scenario 9: Under the Skin's Layers
* **Given**: A Skin with a Dots layer at 30 %, and a picture applied to the Colors section.
* **When**: The Color palette page is shown.
* **Then**: The dots are drawn over the picture, and the palette over both.

### Scenario 10: The Cover
* **Given**: The Cover section, with its Background color `#0D47A1`.
* **When**: The user unfolds Section background.
* **Then**: There is no color field (only image, Fit and opacity); after applying a picture at 50 %, the Cover shows it over `#0D47A1`, under the layers marked Also on the Cover; no inner page changes.

### Scenario 11: A Wrong File
* **Given**: The Logo section.
* **When**: The user chooses a 7 MB `photo.png` in `Logo background image`.
* **Then**: `"The image must be 5 MB or smaller"` is shown, Apply stays off and the pages do not change.

### Scenario 12: Kept Between Pages
* **Given**: A color and an applied picture on the Colors section.
* **When**: The user goes to Home and back to the Brand Manual.
* **Then**: The Color palette page shows the same color and picture, and the group shows the same values.

### Scenario 13: Templates and Orientation
* **Given**: A section background on the Typography section.
* **When**: The user changes to Template 3 and Landscape.
* **Then**: The Typography page keeps its color and picture, filling the whole landscape page.

### Scenario 14: The Same in the PDF
* **Given**: A color on the Logo section and a picture on the Mockups section.
* **When**: The user makes the web PDF.
* **Then**: The Logo pages and the Mockups page look as in the preview.

### Scenario 15: A Picture That Cannot Be Read
* **Given**: An applied section picture whose file can no longer be read.
* **When**: The user makes a PDF.
* **Then**: No PDF is made and `The PDF could not be created. Try again.` is shown.

### Scenario 16: The Group Starts Folded
* **Given**: The Colors section with an unfolded Section background.
* **When**: The user opens another section and comes back to Colors.
* **Then**: Section background is folded, and its values are kept.

## Build Order
1. Types, App state and the page → section mapping; `ManualPage` paints the color (Scenarios 1–4).
2. `SectionBackgroundField` in the six forms, folded (Scenarios 10, 16).
3. The picture: Apply, Remove, Fit, opacity, drawn under the Skin's layers (Scenarios 5–9, 11).
4. Kept between pages; templates and orientation (Scenarios 12, 13).
5. The PDF and its picture check (Scenarios 14, 15); `skins.md`, `export.md`, `colorpicker.md` and `brandmanual.md` updated to point here.
