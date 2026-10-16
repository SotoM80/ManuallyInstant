# Technical Specification: Skins

## 1. What it does
A **skin** is how the **inner pages** of the manual look (every page but the Cover): their **Page background**, their **Page text** color and a stack of decorative **layers** drawn behind their content. Each layer is one preset (a gradient, a shape or a pattern) with its own values, its own two colors and its own Intensity. In the **Skin** section the user sets the two page colors, adds layers, turns each one on or off with a checkbox, moves them up or down to decide which one sits on top, and chooses for each layer whether it is **also drawn on the Cover**. Layers blend by transparency: a layer shows through the ones above it. With no layers, the inner pages show their plain Page background.

The Cover keeps its own colors (see `colorpicker.md`): its Background and Typography colors only paint the Cover. All colors of the Skin are its own: they can be picked freely or taken from the palette, and taking one from the palette copies its value (ADR 0011).

A skin does not depend on the template: it is the same stack under every layout, so ADR 0004 (templates change layout, not content) still holds. See ADR 0009 (drawn in SVG) and ADR 0010 (a stack of layers).

## Out of Scope
* **Textures** (Grain, Paper): they need `feTurbulence`, which the PDF may not support. They wait for the PDF library ADR.
* Moving layers by drag and drop (buttons only, see ADR 0010). Blend modes (Multiply, Screen, Overlay…): layers blend by transparency only.
* More than **4 layers**. More than two colors per layer. Colors that stay linked to the palette (a color taken from it is copied, see ADR 0011).
* Uploading your own textures or images. A different skin on each page. Animated skins.
* Real CMYK (the skin is RGB like the rest of the PDF, see ADR 0003).
* Creating, editing or saving presets. Copying a layer. Keeping a layer's values when its preset is changed (a layer's preset cannot be changed: remove it and add another).
* Warnings about low contrast between the skin and the text (as in `colorpalette.md`).
* The PDF export itself (Phase 4).

## 2. Interface
### Section "5. Skin"
The section has, from top to bottom, the **page colors**, the **Add layer** button with its gallery, then the **list of layers**. Add layer sits above the list so that a new layer, which goes on top of the list, appears right where the user chose it.

**Page colors**: two color fields, **Page background** (default White `#FFFFFF`) and **Page text** (default Black `#000000`). They paint the background and every text of the inner pages: Brand concept, Anatomy, Logo versions, Clear space (its lines and measures too), Color palette and Typography. They never change the Cover. The list reads like the layers panel of a design tool: **the first layer of the list is drawn on top**, the last one just over the page Background.

```
5. Skin
  Page background  [●] #FFFFFF
  Page text        [●] #000000
                          [ + Add layer ]   → opens the gallery here; a new layer goes on top of the list
┌──────────────────────────────────────┐
│ ☑ [▤] Stripes          ↑  ↓  ✕   ▾  │  ← on top
│ ☑ [◉] Radial           ↑  ↓  ✕   ▾  │
│ ☐ [·] Dots             ↑  ↓  ✕   ▾  │  ← hidden: not drawn, keeps its values
│ ☑ [◢] Linear           ↑  ↓  ✕   ▾  │  ← at the bottom
└──────────────────────────────────────┘
```

**Each layer** has a header row, always shown, and a body:
* **Checkbox** `Show <name>`: on → the layer is drawn; off → it is not drawn, but keeps its values, its colors and its place. A new layer starts on.
* **Mini preview**: a small page with the layer drawn at full strength, faded while the layer is hidden.
* **Name**: the preset's name. When two layers use the same preset, the later ones get a number: `Dots`, `Dots 2`.
* **↑ Move up** / **↓ Move down**: swap the layer with its neighbour. ↑ is disabled on the first layer and ↓ on the last. The layers glide to their new places (`useReorderGlide`, like the pages), and the focus stays on the button that was pressed, or on the other arrow of the same layer when that button is now disabled. The page scrolls with the move so the pressed button stays under the pointer: nothing jumps.
* **✕ Remove**: removes the layer at once.
* **▾**: opens the body: first the checkbox **Also on the Cover** (off by default: a layer is only drawn on the inner pages until it is ticked), then one slider per `control` of its preset (label, min, max, step and unit from `presets.ts`, with the value next to it; **Intensity**, 5–100 % step 5, default 30, is always last), then the layer's **Color A** and **Color B**. The bodies work as an **accordion**, like the colors of the Colors section: only one is open at a time, and a new layer opens and folds the open one.

**Add layer** opens the **gallery** under the button: one card per preset with a drawing, grouped under the headings of `SKIN_TYPES` that have at least one: **Gradients** (Linear, Radial), **Shapes** (Circles, Diagonal block, Waves) and **Patterns** (Dots, Stripes). Each card is a small page with the preset drawn at full strength with the colors a new layer would get. Choosing a card adds a layer **at the top of the list**, with the preset's default values, on, not on the Cover, and open, and closes the gallery. The Add layer button stays still while the gallery folds and the new layer takes its place right under it, and the layer's title takes the focus; only the layer's title is brought into view, never the whole open layer, so a tall one (a Shape) does not pull the page down; the page only scrolls if the title is not in view (e.g. on a small screen). Opening or folding the gallery never moves Add layer either. Its **Color A** is palette color 1 and its **Color B** palette color 2; when one of them does not exist, the Page text color fills in for A and the Page background for B. These are copied values: changing the palette later never changes the layer. Escape or clicking Add layer again closes it with no change. With 4 layers, Add layer is disabled, with the note `Up to 4 layers.`

With no layers, the list shows `No layers yet. The inner pages show their plain Page background.`

**Color fields** (Page background, Page text, and Color A / Color B of each layer) all work the same way: the **color picker** of the Cover (swatches, RGB sliders, custom picker and HEX field, see `colorpicker.md`), and under it a row of small chips, one per **palette color** (`Use Red`). Clicking a chip copies that color's HEX into the field. A HEX being typed is only used once it is valid; a wrong one is flagged on blur or Enter with `"Enter a valid HEX color, like #1E88E5"`, and the pages keep the last valid color. With an empty palette there are no chips.

Everything is live: there is no Apply, because nothing here is an image (ADR 0007).

Opening the section features **Brand concept**, the first inner page (`SECTION_PAGES.skin = ['Brand concept']`), as any section does (see `brandmanual.md`).

### On the pages
* **Inner pages**: painted with the **Page background**, their text in the **Page text** color, and one SVG behind their content with one group per layer that is on.
* **Cover**: painted with the Cover's own Background color, its title and "Designed by" in the Cover's Typography color, and one SVG with only the layers that are on **and** marked **Also on the Cover**.
* The groups are drawn from the **last** layer of the list to the **first**, so the first one is on top. A page with no layer to draw has no SVG.
* Each group's opacity is its layer's **Intensity**. The layers blend by transparency only; the content of the page is never faded.
* The SVG sits **over the page's background** and **under all the content** of the page (title, logo, texts, colors, fonts, the grid of 3.2). It ignores the mouse (`pointer-events: none`), so the guide bands of 3.2 keep working, and it is hidden from screen readers (`aria-hidden="true"`).
* It covers the whole page, edge to edge, and is clipped to it.

### Geometry
* The `viewBox` is the A4 page in **mm** for the current orientation: `0 0 210 297` (Portrait) or `0 0 297 210` (Landscape). It scales with the page in every view, Overview (`zoom: 0.5`) included.
* Parameters in `mm` are real millimetres of the A4 page. Parameters in `%` are a share of the page: Center X/Y of its width/height, Radius of its diagonal, Size of its shorter side, Coverage of its area.
* Angles follow CSS: `0°` points **up** and they turn **clockwise**, so a Linear layer at `135°` looks like `linear-gradient(135deg, A, B)`.
* **Unique ids**: gradients and patterns are referenced by id (`fill="url(#…)"`), and ids are shared by the whole document. Every SVG gets its own prefix (React `useId`) and every layer adds its own id to it, so no two layers, pages or previews share a definition.

### The presets
**Gradients and Diagonal block / Waves cover the whole page**. **Circles, Dots and Stripes** only draw their marks: what is under them (another layer, or the page Background) shows between them.
* **Linear** — *Angle*: the direction of the gradient, from Color A to Color B. The line is long enough to reach the page's corners, as in CSS. In mm, with `θ` the angle, `L = |w·sin θ| + |h·cos θ|`, and the line runs through the page's center from `center − dir·L/2` to `center + dir·L/2`, where `dir = (sin θ, −cos θ)`.
* **Radial** — *Center X*, *Center Y*: where Color A is, as a share of the page. *Radius*: where Color B is reached, as a share of the page's diagonal. Past the radius, Color B fills the page.
* **Circles** — *Count* (1–8): how many circles. *Size* (10–90 %): the diameter of the first one, as a share of the page's shorter side; each next one is 70 % of the one before. *Direction*: the first circle sits at the page's center and the next ones line up towards that angle, each one diameter further, so the last ones may leave the page. The circles alternate Color A and Color B.
* **Diagonal block** — the page split in two by a straight edge: Color A below it, Color B above. *Angle* (−60° to 60°): how much the edge leans from horizontal (positive values rise to the right). *Coverage* (10–90 %): the share of the page that Color A covers.
* **Waves** — horizontal wavy bands that fill the page, alternating Color A and Color B. *Amplitude* (2–40 mm): the height of a wave from its middle to its top. *Frequency* (1–8): how many whole waves fit across the page's width. *Angle*: how the waves are turned. Each band is twice the amplitude plus 10 mm high.
* **Dots** — round dots in a square grid, alternating Color A and Color B by row. *Scale*: the distance between dots, in mm (each dot is a third of it wide). *Angle*: how the grid is turned.
* **Stripes** — parallel stripes, alternating Color A and Color B. *Spacing*: from one stripe to the next, in mm. *Thickness*: the width of each stripe, in mm. *Angle*: their direction (0° runs up the page). Thickness can never pass Spacing: its slider's max is the current Spacing, and lowering Spacing below Thickness lowers Thickness with it.

### In the code
* `src/skins/types.ts`: a `Skin` is `{ pageBackground, pageText, layers, nextId }`, with the layers in list order (the first is on top). A `SkinLayer` is `{ id, preset, params, colors, visible, onCover }`, where `colors` are two HEX values; `id` is stable and never reused (`nextId`). `NO_SKIN` has the default page colors and no layers.
* `src/skins/layers.ts`: pure functions for the skin: `setPageColor`, `addLayer` (with the colors of `newLayerColors`), `removeLayer`, `moveLayer(skin, id, -1 | 1)`, `setVisible`, `setOnCover`, `setLayerParam` (with `withParam`, so Thickness stays within Spacing), `setLayerColor`, and `layerNames` (`Dots`, `Dots 2`). They are unit tested.
* `src/skins/presets.ts` lists the presets (ids, defaults, controls); the form is built from it.
* `src/skins/colors.ts`: `newLayerColors(palette, skin)`, the copied colors of a new layer.
* `SkinColorField`: the color picker of `colorpicker.md` (`ColorPicker`) with its own HEX being typed, plus the palette chips.
* `src/skins/draw/<preset>.ts`: one **pure function** per preset, `(params, [a, b], page) → shape`. `src/skins/draw/index.ts` maps preset ids to them; the gallery offers only presets listed there.
* `SkinBackdrop` (the component that was `SkinLayer`): draws the visible layers of a skin in one SVG, bottom first. `ManualPreview` puts one in every page, before the content: all layers on the inner pages, only those Also on the Cover on the Cover. The mini previews and gallery cards use it with a one-layer skin.
* `SkinForm`: the list, the accordion and the gallery.
* The skin is kept in `App`, above the routes, like the template and the orientation, so it survives moving between pages.

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`).
* **Postconditions**: Every inner page shows the Page background, the Page text color and the layers that are on, in the order of the list (the first on top), each with its values, colors and Intensity, behind the content. The Cover shows its own colors and only the layers that are on and Also on the Cover.

## 4. Invariants
* All inner pages always draw the same layers, in the same order, on the same Page background and with the same Page text color.
* The Cover's Background and Typography colors only paint the Cover; the Skin's colors never paint the Cover, except the layers marked Also on the Cover.
* The skin never changes, moves or covers the content of a page; Template, Orientation and Preview view combine freely with it.
* The first layer of the list is always drawn on top, and the last one just over the Background.
* A skin has 0 to 4 layers. A hidden layer keeps its values, colors and place.
* Every color of the Skin is always a valid HEX.
* Changing or removing a palette color never changes the Skin: colors taken from the palette are copies.
* Every value stays between its control's min and max, and Thickness never passes Spacing.
* No two SVG definitions on the page share an id.
* The skin is kept when the user moves between pages. It is only reset (to no layers) when the browser page is refreshed.

## Failure Modes
Only a typed HEX can be wrong. Otherwise:
* **Sliders** cannot go past their limits; **↑ / ↓** are disabled at the ends of the list; **Add layer** is disabled at 4 layers.
* **A wrong HEX** in a color field is flagged with `"Enter a valid HEX color, like #1E88E5"`, and the pages keep the last valid color.
* **An empty palette**: there are no chips, and a new layer takes the Page text and Page background colors.
* **A layer whose preset has no drawing** (not expected in the UI) draws nothing.

## 5. Given-When-Then Test Criteria

### Scenario 1: No Layers by Default
* **Given**: The user opens the Brand Manual page.
* **When**: The user opens "5. Skin".
* **Then**: Page background is White and Page text is Black, the list says "No layers yet…", Add layer is on, the pages show their plain backgrounds, and Brand concept comes first in the preview.

### Scenario 2: The Gallery
* **Given**: The Skin section is open.
* **When**: The user clicks Add layer.
* **Then**: The gallery shows Gradients (Linear, Radial), Shapes (Circles, Diagonal block, Waves) and Patterns (Dots, Stripes), and no Textures.

### Scenario 3: Adding a Layer
* **Given**: No layers, and the palette has two colors.
* **When**: The user adds **Linear**.
* **Then**: The list has one layer, "Linear", on and open, with Angle 135° and Intensity 30 %, Color A palette color 1 and Color B palette color 2; every inner page has that gradient at 0.3 opacity, the Cover has none; the gallery is closed.

### Scenario 4: A New Layer Goes on Top
* **Given**: The list has Linear.
* **When**: The user adds **Dots**.
* **Then**: The list reads Dots, Linear; on every page the dots are drawn over the gradient; Dots is open and Linear is folded.

### Scenario 5: Hiding a Layer
* **Given**: The list has Dots (on) and Linear (on).
* **When**: The user unticks "Show Dots".
* **Then**: The pages only show the gradient. Ticking it again shows the dots with the values they had.

### Scenario 6: Moving a Layer
* **Given**: The list reads Dots, Linear.
* **When**: The user clicks "Move down" on Dots.
* **Then**: The list reads Linear, Dots, the gradient is drawn over the dots, and Move down of Dots is now disabled (Dots is last), so the focus moves to its Move up button.

### Scenario 7: The Ends of the List
* **Given**: The list reads Stripes, Radial, Linear.
* **When**: The user looks at the buttons.
* **Then**: Move up is disabled on Stripes, Move down is disabled on Linear, and both are on for Radial.

### Scenario 8: Removing a Layer
* **Given**: The list reads Dots, Linear.
* **When**: The user clicks "Remove Dots".
* **Then**: The list has only Linear, and the pages only show the gradient.

### Scenario 9: Up to Four Layers
* **Given**: The list has 4 layers.
* **When**: The user looks at Add layer.
* **Then**: It is disabled, with the note "Up to 4 layers." Removing a layer turns it on again.

### Scenario 10: Two Layers with the Same Preset
* **Given**: The list has Dots.
* **When**: The user adds Dots again.
* **Then**: The list reads Dots 2, Dots, and each one keeps its own values.

### Scenario 11: Each Layer Has Its Own Values
* **Given**: The list reads Dots, Linear.
* **When**: The user sets the Intensity of Linear to 80 % and Color A of Dots to Blue (`#1E88E5`).
* **Then**: The gradient is drawn at 0.8 opacity and the dots at 0.3; only the dots use Blue.

### Scenario 12: Changing the Angle
* **Given**: A Linear layer at 135° on a portrait page.
* **When**: The user sets its Angle to 45°.
* **Then**: The gradient line runs from about `(−21.75, 275.25)` to `(231.75, 21.75)` mm.

### Scenario 13: An Empty Palette
* **Given**: The palette is empty.
* **When**: The user adds Linear.
* **Then**: The gradient goes from black (Page text) to white (Page background), and no palette chips are shown.

### Scenario 14: Colors Are Copied from the Palette
* **Given**: The palette has Red and Green; a Linear layer goes from Red to Green.
* **When**: The user clicks "Use Green" under its Color A, then changes Green to Blue in Colors and removes Red.
* **Then**: After the chip, the layer goes from Green to Green; changing and removing palette colors does not change it.

### Scenario 15: Thickness Never Passes Spacing
* **Given**: A Stripes layer with Spacing 12 mm and Thickness 10 mm.
* **When**: The user lowers Spacing to 6 mm.
* **Then**: Thickness becomes 6 mm, and its slider cannot go past 6.

### Scenario 16: Template and Orientation Keep the Skin
* **Given**: The list reads Dots, Linear.
* **When**: The user selects Template 3 and Landscape.
* **Then**: Every inner page still draws the dots over the gradient, now in `viewBox="0 0 297 210"`.

### Scenario 17: Unique Ids
* **Given**: The list reads Dots 2, Dots, Linear, and the gallery is open.
* **When**: The user looks at the document.
* **Then**: Every gradient and pattern id in the pages, the mini previews and the gallery is different.

### Scenario 18: The Skin Is Kept Between Pages
* **Given**: The list reads Dots, Linear, with Dots hidden.
* **When**: The user goes to Home and then back to Brand Manual.
* **Then**: The list still reads Dots (hidden), Linear, with the same values.

### Scenario 19: The Guides Still Work
* **Given**: A layer is on and 3.2 shows the grid drawn by the app.
* **When**: The user clicks the top guide band.
* **Then**: A guide is added, as without a skin.

### Scenario 20: The Cover Keeps Its Own Colors
* **Given**: The Cover's Background color is Navy and its Typography color is White.
* **When**: The user looks at the inner pages.
* **Then**: They are White with Black text (the Skin's defaults); only the Cover is Navy with a white title.

### Scenario 21: Page Colors
* **Given**: The Skin section is open.
* **When**: The user picks Beige as Page background and types `#2b2d42` as Page text.
* **Then**: Every inner page turns Beige with `#2B2D42` text at once (the Clear space lines too); the Cover does not change.

### Scenario 22: A Layer Also on the Cover
* **Given**: The list reads Dots, Linear; the Cover has no layers.
* **When**: The user ticks **Also on the Cover** in Linear.
* **Then**: The Cover draws the gradient (and not the dots), over its own Background color; the inner pages still draw both.

### Scenario 23: A Wrong HEX
* **Given**: Page background is White.
* **When**: The user types `blue` in its HEX field and leaves it.
* **Then**: The field shows "Enter a valid HEX color, like #1E88E5", and the inner pages stay White.

## Build Order
1. ~~Linear, `SkinLayer`, the section with one preset, Radial, Dots and Stripes~~ (done, one preset at a time).
2. ~~The layer model: `Skin = { layers }`, `src/skins/layers.ts` and its unit tests.~~
3. ~~`SkinBackdrop`: one SVG with a group per visible layer, bottom first, with ids per layer. Checked with `npm run dev` using two layers turned on by hand.~~
4. ~~The Skin section as a list: checkbox, mini preview, ↑ ↓ ✕, accordion, Add layer with the gallery, the 4-layer limit.~~
5. ~~Shapes: Circles, Diagonal block and Waves, one at a time, each with its unit test (after step 6).~~
6. ~~Page colors and Also on the Cover: the Cover's colors only paint the Cover (ADR 0011), Page background and Page text in the Skin, and the color fields with palette chips.~~
7. Later: Textures once the PDF library is chosen; the skin in both PDFs (Phase 4).
