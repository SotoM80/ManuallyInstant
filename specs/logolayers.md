# Technical Specification: Logo Layers from SVG

## 1. What it does
Part of the **Logo** section, group **Anatomy**. Designers build a logo in Illustrator with each piece on its own layer (the logotype, the tagline…). When the **image of a mark card** (e.g. Imagotype) is an SVG exported from Illustrator with its layers, each layer becomes a **part** of that card, with its label and its image. The Anatomy page then shows how the mark is built (e.g. Logotype + Tagline = Imagotype) from one file, instead of one file per part uploaded by hand.

## Out of Scope
`.ai`, `.pdf` and `.eps` files (see ADR 0015). Groups and sublayers inside a layer: a layer is one part, whatever it holds. Layers in the images of Logo versions, the Cover or the construction grid. Editing the drawing of a layer. Filling the name and role of a part (they stay for the user to write). Replacing parts that already exist with the file's layers (a later version may add a button for it).

## 2. Interface
### Exporting from Illustrator
Under the Mark type choice of the Anatomy group, one hint: **"Layered logo? Export it from Illustrator as SVG, with Object IDs: Layer Names and the text outlined, and each layer becomes a part."** In Illustrator: File → Export → Export As… → SVG (or Save As → SVG), with *Object IDs: Layer Names*.

### Layers of a file
* A **layer** is a group (`<g>`) at the top level of the SVG. When the whole drawing sits in one outer group whose children are named groups (some Illustrator exports add one), the layers are those children.
* A layer is skipped when it is **hidden** (`display: none` or `visibility: hidden`, as an attribute or a style) or **draws nothing** (no `path`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, `text`, `image` or `use` outside `defs`, `clipPath`, `mask` and `symbol`).
* Shapes at the top level of the file, outside any group, belong to no layer: they stay in the card's image (the whole logo) and in no part.
* A **layered SVG** has **2 or more** layers left.

### Choosing a layered SVG
When a layered SVG is chosen as the image of a mark card **that has no parts**:
* The card gets **one part per layer, up to 4**, in **reading order**: from left to right by where each layer starts, and from top to bottom for layers that start at the same place.
* **Label** of each part, from the layer's name (`data-name`, or its `id` with Illustrator's escapes undone, e.g. `Capa_1` → "Capa 1"):
  * isotipo, isotype, símbolo, symbol, brandmark → **Isotype / Brandmark**
  * logotipo, logotype, wordmark → **Logotype / Wordmark**
  * tagline, eslogan, slogan → **Tagline**
  * Case and accents do not matter ("ISOTIPO", "Isótipo").
  * Illustrator's default names (**Capa N**, **Layer N**, **Ebene N**, **Calque N**, **Livello N**, **Camada N**) and layers with no name give an **empty label**, so the page shows **Part N**, as for any part with no label.
  * Any other name is kept as it is (e.g. "Monogram").
* **Image** of each part: an SVG with only that layer and every non-drawing element of the file (`defs`, `style`, `title`), so its colors, gradients, clip paths and fill rules are the file's own. It is cropped to what the layer draws, with a small margin, and fills its box on the Anatomy page like any part image (a small tagline shows as big as the logotype). Its file name is `{file}-{layer}.svg`, with the layer's name made safe for a file name (letters, digits and `-`), or `{file}-part-N.svg` when it has no name.
* **Name** and **role** of each part stay empty.
* The card's own image is the whole file, as today.

### Card that already has parts
Its parts are kept as they are, and the hint **"Remove the parts of this card to use the layers of this SVG."** appears under the card's image field. With no parts left, choosing the file again fills them.

### More than 4 layers
The first 4 layers in reading order become parts, and the hint **"Only the first 4 layers are used."** appears under the card's image field.

### Hints
A card shows at most one of the hints above, for the last file chosen. Choosing another file (or none) clears it.

### Apply
The whole logo and the images of the new parts wait for the **card's Apply** (e.g. `Apply Imagotype image`; see `brandmanual.md` and ADR 0020), even when it is pressed while the file is still being read: then the parts arrive already applied. Each new part also has its own Apply, which shows only that part's image. The labels reach the form and the Anatomy page at once; the images only after an Apply.

### Other files
A PNG, JPG, WebP or an SVG with fewer than 2 layers works exactly as before: it is the card's image and makes no parts.

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`), in the Logo section, group Anatomy, with at least one mark type ticked.
* **Postconditions**: A card with no parts that gets a layered SVG has one part per layer (at most 4), in reading order, each with its label and its image. After the card's Apply, the Anatomy page shows them.

## 4. Invariants
* The user's SVG is only ever drawn **as an image** (never placed in the page as markup), so nothing in it can run.
* A part made from a layer is an ordinary part: it can be renamed, given another image or removed, and **Add part** works as before.
* Parts that exist are never replaced or added to by a file's layers.
* A card never has more than 4 parts.
* The image of a part draws exactly what its layer draws in the file, with the file's own styles.
* Hidden layers and layers that draw nothing are never turned into parts.
* Text reaches the form and the page at once; images only after an Apply. The card's Apply shows the card's image and the parts made from it, all at once.

## Failure Modes
* **Wrong type or bigger than 5 MB**: the same errors as today (`"Use a PNG, JPG, SVG or WebP image"`, `"The image must be 5 MB or smaller"`); no parts are made.
* **SVG that is not valid XML**: the file is still the card's image, no parts are made, and the hint **"The layers of this SVG could not be read."** appears.
* **SVG with neither `viewBox` nor `width` and `height`**: there is nothing to crop against: no parts are made, with the same hint.
* **Layer that cannot be drawn** (the browser fails to draw it as an image): its part keeps the whole file's canvas, uncropped, and its place in the reading order is the end.

## 5. Given-When-Then Test Criteria

### Scenario 1: Layers Fill an Empty Card
* **Given**: The Imagotype card has no parts.
* **When**: The user chooses `volta.svg`, with the layers "Logotipo" (on the left) and "Tagline" (on the right).
* **Then**: The card shows two parts, labelled "Logotype / Wordmark" and "Tagline", in that order, with the files `volta-Logotipo.svg` and `volta-Tagline.svg`, and empty names and roles.

### Scenario 2: Default Layer Names
* **Given**: The Imagotype card has no parts.
* **When**: The user chooses an SVG whose layers are "Capa 1" (on the left) and "Capa 2" (on the right), as Illustrator names them.
* **Then**: The card has two parts with empty labels, and the Anatomy page shows them as "Part 1" and "Part 2".

### Scenario 3: Reading Order, Not Layer Order
* **Given**: The Imagotype card has no parts.
* **When**: The user chooses an SVG whose top layer in Illustrator ("Tagline") is drawn on the right and whose bottom layer ("Isotipo") is drawn on the left.
* **Then**: The first part is "Isotype / Brandmark" and the second "Tagline".

### Scenario 4: Existing Parts Are Kept
* **Given**: The Imagotype card has one part labelled "Monogram".
* **When**: The user chooses a layered SVG.
* **Then**: The card keeps only its "Monogram" part and shows "Remove the parts of this card to use the layers of this SVG."

### Scenario 5: More Than Four Layers
* **Given**: The Imagotype card has no parts.
* **When**: The user chooses an SVG with five layers.
* **Then**: The card has four parts, the first four in reading order, and shows "Only the first 4 layers are used."

### Scenario 6: Hidden and Empty Layers Are Skipped
* **Given**: The Imagotype card has no parts.
* **When**: The user chooses an SVG with four layers: two that draw, one hidden and one that only holds a clip path.
* **Then**: The card has two parts, made from the two layers that draw.

### Scenario 7: Parts Wait for Apply
* **Given**: The user has chosen a layered SVG for the Imagotype card.
* **When**: The user looks at the Anatomy page before and after clicking "Apply Imagotype image".
* **Then**: Before it the page shows the labels of the parts with empty boxes; after it the page shows the whole logo and the image of each part, and the parts' own Apply buttons are off.

### Scenario 7b: Apply While the File Is Read
* **Given**: The user has just chosen a layered SVG for the Imagotype card, and its layers are still being read.
* **When**: The user clicks "Apply Imagotype image" before the parts appear.
* **Then**: When the parts appear, the Anatomy page already shows their images, and their own Apply buttons are off.

### Scenario 8: Files Without Layers
* **Given**: The Imagotype card has no parts.
* **When**: The user chooses a PNG, or an SVG with a single layer.
* **Then**: The file is the card's image, the card still has no parts and no hint appears.

### Scenario 9: A File That Cannot Be Read
* **Given**: The Imagotype card has no parts.
* **When**: The user chooses a file named `logo.svg` whose content is not valid SVG.
* **Then**: The card has no parts and shows "The layers of this SVG could not be read."
