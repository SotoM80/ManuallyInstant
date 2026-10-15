# Technical Specification: Skins

## 1. What it does
A **skin** is a decorative layer drawn behind the content of **every page** of the manual, made from two colors of the brand palette: a gradient or a simple pattern. The user picks one preset in the **Skin** section, sets its few sliders and chooses its two colors. The default is **None**: the plain background of today.

A skin does not depend on the template: it is the same layer under every layout, so ADR 0004 (templates change layout, not content) still holds. See ADR 0009.

## Out of Scope
* **Later presets**: Shapes (Circles, Diagonal block, Waves) and Textures (Grain, Paper). They will get their own scenarios when they are built; Textures wait for the PDF library (they need `feTurbulence`).
* Uploading your own textures or images. A different skin on each page. Animated skins.
* More than two colors per skin.
* Real CMYK (the skin is RGB like the rest of the PDF, see ADR 0003).
* Creating, editing or saving presets. Keeping each preset's values when switching to another one.
* Warnings about low contrast between the skin and the text (as in `colorpalette.md`).
* The PDF export itself (Phase 4).

## 2. Interface
### Section "5. Skin"
A new section of the accordion, after Typography (it uses the palette of Colors). Its work area has three parts, from top to bottom:
* **Gallery**: a card for **None** first (selected by default), then the presets grouped under the headings of `SKIN_TYPES` that have at least one preset: **Gradients** (Linear, Radial) and **Patterns** (Dots, Stripes). Only presets with a drawing in `draw/index.ts` are shown, so a preset that is not built yet never appears. Each card shows the preset's name and a small preview drawn with the same SVG as the pages, using the current colors. Choosing a card applies the preset **with its default values**; the two colors stay as they were.
* **Controls**: one slider per `control` of the chosen preset, in the order of `presets.ts`, with its label, min, max, step and unit from there, and its value next to it (e.g. `135°`). **Intensity** (5–100 %, step 5, default 30) is always last. With None there are no controls.
* **Colors**: two selects, **Color A** and **Color B**. Each one offers **Auto** (the default) and every palette color by its swatch and name (or `Color N` when it has no name). What each one draws with:
  * a chosen palette color → that color;
  * **Auto** → Color A takes palette color 1, Color B palette color 2;
  * when that palette color does not exist → Color A takes the **Typography color** and Color B the **Background color** of the Cover.

  A short note under them: `Auto uses your first two palette colors. Without them, the Typography and Background colors fill in.` Color A and Color B may be the same color.

Everything is live: there is no Apply, because nothing here is an image (ADR 0007).

Opening the section features the **Cover** (`SECTION_PAGES.skin = ['Cover']`). Since the Cover is already first, the pages do not move; only the section moves to the top of its column (see `brandmanual.md`).

### On the pages
* The layer sits **over the Background color** of the Cover section and **under all the content** of the page (title, logo, texts, colors, fonts, the grid of 3.2).
* Its opacity is **Intensity**. The content itself is never faded.
* It ignores the mouse (`pointer-events: none`), so the guide bands of 3.2 keep working. It is hidden from screen readers (`aria-hidden="true"`): it is decoration.
* It covers the whole page, edge to edge, and is clipped to it.
* Before the Cover section is touched, the page colors are the Cover defaults (`DEFAULT_TYPOGRAPHY_COLOR` black, `DEFAULT_BACKGROUND_COLOR` white, in `src/data/colorPalette.ts`).

### Geometry
* Each page's layer is an SVG whose `viewBox` is the A4 page in **mm** for the current orientation: `0 0 210 297` (Portrait) or `0 0 297 210` (Landscape). It scales with the page in every view, Overview (`zoom: 0.5`) included.
* Parameters in `mm` are real millimetres of the A4 page. Parameters in `%` are a share of the page: Center X/Y of its width/height, Radius of its diagonal.
* Angles follow CSS: `0°` points **up** and they turn **clockwise**, so a Linear skin at `135°` looks like `linear-gradient(135deg, A, B)`.
* **Unique ids**: gradients and patterns are referenced by id (`fill="url(#…)"`), and ids are shared by the whole document. Every SVG (seven pages and every gallery card) gets its own ids (React `useId`), so one never paints with another one's definition.

### The presets
Gradients cover the whole page. Patterns only draw their marks: the page Background shows between them.
* **Linear** — *Angle*: the direction of the gradient, from Color A to Color B. The line is long enough to reach the page's corners, as in CSS: Color A fills one corner and Color B the opposite one. In mm, with `θ` the angle, `L = |w·sin θ| + |h·cos θ|`, and the line runs through the page's center from `center − dir·L/2` to `center + dir·L/2`, where `dir = (sin θ, −cos θ)`.
* **Radial** — *Center X*, *Center Y*: where Color A is, as a share of the page. *Radius*: where Color B is reached, as a share of the page's diagonal. Past the radius, Color B fills the page.
* **Dots** — round dots in a square grid, alternating Color A and Color B by row. *Scale*: the distance between dots, in mm (each dot is a third of it wide). *Angle*: how the grid is turned.
* **Stripes** — parallel stripes, alternating Color A and Color B. *Spacing*: from one stripe to the next, in mm. *Thickness*: the width of each stripe, in mm. *Angle*: their direction. Thickness can never pass Spacing: its slider's max is the current Spacing, and lowering Spacing below Thickness lowers Thickness with it.

### In the code
* `src/skins/presets.ts` lists the presets (ids, defaults, controls); the form is built from it. For the MVP it keeps Linear, Radial, Dots and Stripes; the later presets come back with their drawings.
* `src/skins/colors.ts` turns Color A and Color B into two HEX values (`skinColors`), following the rules of *Colors* above.
* **Which color**: the skin stores each color as a palette color **id**, or `null` for Auto. The palette gets a stable `id` per color (the `key` the Colors form already keeps per row), so removing a color never makes the skin point at another one. A skin color whose id is no longer in the palette counts as Auto.
* `src/skins/draw/<preset>.ts`: one **pure function** per preset, `(params, [a, b], page) → shapes`, where `page` is `{ width, height }` in mm and the result describes the SVG (gradient stops and end points, pattern tile and marks). It has no React and no DOM, so it is unit tested.
* `src/skins/draw/index.ts`: a map `preset id → drawing function`. The gallery is built from it.
* `SkinLayer`: a component that calls the drawing function and only turns its result into SVG elements. `ManualPreview` puts one in every page, before the content.
* The skin is kept in `App`, above the routes, like the template and the orientation, so it survives moving between pages.

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`).
* **Postconditions**: Every page of the preview shows the chosen skin, with its values and colors, behind its content. With None, every page shows its plain Background color.

## 4. Invariants
* All pages always use the same skin.
* The skin never changes, moves or covers the content of a page; Template, Orientation and Preview view combine freely with every skin.
* A skin always draws with two valid colors.
* Removing a palette color never makes the skin use a different palette color: a skin color that pointed to it becomes Auto.
* Every value stays between its control's min and max, and Thickness never passes Spacing.
* No two SVG definitions on the page share an id.
* The chosen skin is kept when the user moves between pages. It is only reset (to None) when the browser page is refreshed.

## Failure Modes
Nothing the user does here can be wrong, so there are no error messages. Instead:
* **Sliders** cannot go past their limits.
* **A missing color** (empty palette, removed color, invalid HEX still being typed in Colors) is filled in by the Auto rule or the Cover colors, and the page keeps drawing.
* **A skin id with no drawing** (not expected in the UI) draws nothing, as None.

## 5. Given-When-Then Test Criteria

### Scenario 1: None by Default
* **Given**: The user opens the Brand Manual page.
* **When**: The user opens "5. Skin".
* **Then**: None is selected, there are no sliders, Color A and Color B are Auto, the pages show their plain Background color, and the Cover stays first.

### Scenario 2: Only Built Presets in the Gallery
* **Given**: The Skin section is open.
* **When**: The user looks at the gallery.
* **Then**: It shows None, then Gradients (Linear, Radial) and Patterns (Dots, Stripes), and no Shapes or Textures.

### Scenario 3: Choosing Linear
* **Given**: The palette has two colors and None is selected.
* **When**: The user chooses **Linear**.
* **Then**: Every page has a gradient from palette color 1 to palette color 2 at 135°, at 0.3 opacity, and the sliders Angle (135°) and Intensity (30 %) appear.

### Scenario 4: Changing the Angle
* **Given**: Linear at 135° on a portrait page.
* **When**: The user sets Angle to 45°.
* **Then**: The gradient line runs from about `(−21.75, 275.25)` to `(231.75, 21.75)` mm: Color A at the bottom-left corner, Color B at the top-right one.

### Scenario 5: Intensity
* **Given**: Linear at 30 % intensity.
* **When**: The user sets Intensity to 80 %.
* **Then**: The layer is drawn at 0.8 opacity, and the content of the pages is unchanged.

### Scenario 6: Choosing the Colors
* **Given**: The palette has Red, Green and Blue; both colors are Auto (Red and Green).
* **When**: The user sets Color A to Blue.
* **Then**: The skin goes from Blue to Green at once.

### Scenario 7: An Empty Palette
* **Given**: The palette is empty and the Cover was never touched.
* **When**: The user chooses Linear.
* **Then**: The gradient goes from black (Typography) to white (Background).

### Scenario 8: Removing a Color in the Middle
* **Given**: The palette has Red, Green and Blue; Color A is Blue, Color B is Red.
* **When**: The user removes Green in the Colors section.
* **Then**: The skin still goes from Blue to Red.

### Scenario 9: Removing a Chosen Color
* **Given**: The palette has Red, Green and Blue; Color A is Blue.
* **When**: The user removes Blue.
* **Then**: Color A shows Auto, and the skin goes from Red to Green, with no error.

### Scenario 10: Changing the Preset Keeps the Colors
* **Given**: Linear at 45°, with Color A set to Blue.
* **When**: The user chooses Stripes and then Linear again.
* **Then**: Stripes shows its default values with Color A still Blue; back on Linear, the Angle is 135° again.

### Scenario 11: Thickness Never Passes Spacing
* **Given**: Stripes with Spacing 12 mm and Thickness 10 mm.
* **When**: The user lowers Spacing to 6 mm.
* **Then**: Thickness becomes 6 mm, and its slider cannot go past 6.

### Scenario 12: Template and Orientation Keep the Skin
* **Given**: Linear at 135° is chosen.
* **When**: The user selects Template 3 and Landscape.
* **Then**: Every page still shows the gradient, now in `viewBox="0 0 297 210"`, under the Template 3 layout.

### Scenario 13: Unique Ids
* **Given**: The Skin section is open with Linear chosen.
* **When**: The user looks at the document.
* **Then**: Every gradient and pattern id in the pages and the gallery is different.

### Scenario 14: The Skin Is Kept Between Pages
* **Given**: The user chose Dots.
* **When**: The user goes to Home and then back to Brand Manual.
* **Then**: Dots is still selected and drawn, with the same values.

### Scenario 15: Back to None
* **Given**: Stripes is chosen.
* **When**: The user chooses **None**.
* **Then**: The layer is gone from every page and the sliders disappear.

### Scenario 16: The Guides Still Work
* **Given**: A skin is chosen and 3.2 shows the grid drawn by the app.
* **When**: The user clicks the top guide band.
* **Then**: A guide is added, as without a skin.

## Build Order
1. `draw/linear.ts` and its unit test (end points for 0°, 45°, 135°, and landscape).
2. `SkinLayer` in `ManualPreview`, behind the content, with `useId`.
3. Skin state in `App`, turned on by hand with Linear, and checked with `npm run dev`.
4. Stable palette ids, `Skin.colors` as ids or Auto, and `skinColors` with the Auto rule (scenarios 7–9).
5. The Skin section: gallery, controls and colors, plus `skin` in `MANUAL_SECTIONS` and `SECTION_PAGES`.
6. Radial, Dots and Stripes, one at a time, each with its unit test.
7. Later: Shapes, then Textures once the PDF library is chosen, then the skin in both PDFs (Phase 4).
