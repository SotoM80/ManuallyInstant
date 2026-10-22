# Technical Specification: Mockups

## 1. What it does
A **Mockups** section and a new page, **8. Mockups**, that show the brand's logo applied to products: a business card, a t-shirt, a mug, a phone screen… The user chooses **up to 4** products from a list of 6, and for each one its **color** and **which version of the logo** it carries (a white version on a dark product, for example). A product is either a flat **illustration** drawn by the app (it takes any color and stays sharp in both PDFs, ADR 0013) or a **photo template**: a real product photo on which the logo is composed with perspective, shading and the folds of the product, and which the user can tint and place the logo on by dragging it (ADR 0014, section *Photo mockups* below).

## Out of Scope
* **More products** (Envelope, Cap, Storefront sign, Bottle, Browser): later, one at a time, each with its own scenario. This version has 6.
* For **illustrations**: perspective, curves and blend modes; the logo sits flat in its box. Photo templates have them (see *Photo mockups*).
* Embroidery, foil or emboss effects; more than one logo on a product.
* Saving a template made in the editor, or an uploaded photo, between sessions (ADR 0002): the editor can download it as a file for the developers to add.
* Warnings when the logo and the product have the same or a similar color (a white logo on a white t-shirt): as with the palette (`colorpalette.md`), contrast is the designer's call.
* Fitting very wide or very tall logos better: a logo keeps its proportions in its box, so a very long one can look small.
* More than 4 mockups, a page per mockup, or choosing their order (they follow the order of the list).
* Text on the products (a name or a phone number on the business card), or the brand fonts on them.
* Saving the choice between sessions (ADR 0002).

## 2. Interface
### Section "7. Mockups"
A new section of the accordion, after Skin (it uses the logo versions of Logo and the palette of Colors). From top to bottom:

**Products**: the 6 products as checkboxes, grouped under four headings, each with its name and a small drawing of the product (decoration only: hidden from screen readers, the checkbox already says the name):

| Group | Products |
|---|---|
| **Stationery** | Business card, Letterhead |
| **Apparel & bags** | T-shirt, Tote bag |
| **Objects** | Mug |
| **Screens** | Phone |

* By default **Business card, T-shirt, Mug and Phone** are ticked (one per group), so the page has content from the start.
* With 4 ticked, the unticked ones are disabled, with the note `Up to 4 mockups.` Unticking one turns them on again.

**Settings of each ticked product**, under the list, in the order of the list, as an **accordion** like the layers of the Skin: each product is a block with a header (its small drawing in its current color, and its name) that opens its body. Only one body is open at a time; all are folded at the start, and ticking a product opens its block and folds the open one. The body has:
* **Color**: the same color field as the Skin (the Cover's color picker plus chips that copy a palette color, see `skins.md`). Its label says what it paints: **Icon color** for the Phone, **Product color** for the others. Each product starts with its own default color (below).
* **Logo**: a select with every logo version. Version 1 reads `<name> (Primary)`, or `Primary` when it has no name; the others read as on the Logo versions page (`versionName`: their name, or `Version N`). Default: the Primary.

A product that is unticked keeps its color and logo version: ticking it again brings them back. They are only reset when the browser page is refreshed.

Everything is live: there is no Apply (ADR 0007). A new logo image still waits for Apply in the Logo section, and the mockups show it once applied.

Opening the section features the **Mockups** page (`SECTION_PAGES.mockups = ['Mockups']`).

### Which logo a mockup shows
What the user chose and what is shown are kept apart: the mockup stores the chosen version, and the image is worked out when it is drawn. In this order, the first one that exists:
1. The image of the chosen version.
2. The image of the Primary version (Version 1).
3. The logo applied in the Cover section.
4. None: the logo's box shows a dashed placeholder, so the user sees where the logo goes.

What the **Logo select** shows:
* A chosen version that has **no image yet** stays chosen (its image may still come); the mockup shows the next one in the chain meanwhile.
* A chosen version that was **removed** from the Logo section goes back to **Primary**, in the mockup and in the select.

The logo keeps its proportions and is centered in its box (`xMidYMid meet`).

### The Mockups page
* Header, like the Logo pages (`logo-page` structure): the brand name (from the Logo section; the Cover title when it is empty; no brand line when both are empty) and the heading **Mockups**.
* The ticked mockups, each with its name as a caption, in a grid of two columns:
  * **1** mockup takes the whole area;
  * **2** sit side by side;
  * **3**: two on the first row, the third centered on the second;
  * **4**: two rows of two.
  The same in Portrait and Landscape.
* With none ticked, the page shows `Choose mockups in the Mockups section`.
* Each mockup is an image for screen readers, named after its product (`role="img"`, `aria-label="T-shirt mockup"`).
* The page uses the Skin's Page background, Page text and layers like every inner page (`skins.md`).

### The products
Every product is drawn on its own `viewBox` (in its own units, not mm), from shapes painted with the **color** of the product, plus fixed translucent shadows and lights for volume, and a few fixed details (the phone's frame, the inside of the mug). Default colors are light, so a dark Primary logo reads on them.

| Product | Default color | Where the logo sits |
|---|---|---|
| Business card | White `#FFFFFF` | Centered on the front of a card lying on a second one |
| Letterhead | White `#FFFFFF` | Top-left of an A4 sheet, small |
| T-shirt | White `#FFFFFF` | Center of the chest |
| Tote bag | Canvas `#EDE6D6` | Center of the bag, under the handles |
| Mug | White `#FFFFFF` | Center of the side, opposite the handle |
| Phone | White `#FFFFFF` | The app icon in the middle of the home screen: the color is the icon's background; the phone's frame and screen are fixed dark gray |

### In the code
* `src/mockups/types.ts`: `MockupId`, and `Mockups = { chosen: MockupId[]; settings: Record<MockupId, { color: string; version: number | null }> }`. `chosen` is always in the order of the product list. `version` is the **id** of a logo version other than the Primary, or `null` for the Primary (the Primary is never stored by its id). `settings` has every product, ticked or not, which is why an unticked product keeps its color.
* **Stable ids for the logo versions**: each `LogoVariant` gets an `id` that stays the same while it exists and is never reused: the `key` the Logo form already keeps per version (`LogoForm.tsx`), now passed up with `LogoData.variants`, as the palette colors do. A mockup stores that id, not the version's place, so removing Version 2 never makes a mockup that used Version 3 show another one; an id no longer in the list counts as the Primary.
* `src/mockups/products.ts`: `MOCKUP_GROUPS` and `MOCKUP_PRODUCTS`: plain data per product (`id`, `name`, `group`, `color`, `colorLabel`, `viewBox`, `parts`, `logo`). A part is `{ d, fill, opacity? }`, where `fill` is `'product'`, `'shade'`, `'light'` or a fixed HEX; `logo` is the box `{ x, y, width, height, rotate? }`. The paths may be drawn in a design tool; only their `d` values are kept here (ADR 0013). **No `<defs>`, gradients, clip paths or ids** in a product: the same product is drawn up to three times at once (the page, the PDF copy, the form), and ids would collide (the lesson of ADR 0009). If one is ever needed, its id is built with `useId`.
* `src/mockups/mockups.ts`: pure functions, like `src/skins/layers.ts`: `toggleMockup` (keeps the list order, at most 4), `setMockupColor`, `setMockupVersion`, `chosenVersion(logo, version)` (the select's value: the id, or `null` when it was removed), and `mockupLogo(logo, coverLogo, version)` (the chain above). Unit tested.
* `MockupArt`: draws one product in SVG from its data, with colors and opacities as **attributes** (never CSS classes), so the PDF copy draws it as is (ADR 0012).
* `MockupsPage` (the page, with a `.mockups-layout` inside `.logo-page`) and `MockupsForm` (the section, controlled like `SkinForm`). The choice is kept in `App`, above the routes, like the Skin.
* **Template CSS**: `.mockups-grid` and its captions in `src/templates/shared.css` (with sizes for the Grid and Pages views), and a `.mockups-layout` rule in `src/templates/template3/template3.css` like the ones of the other Logo pages (`anatomy-layout`, `versions-layout`, `clearspace-layout`), so it uses the side column.
* `MANUAL_SECTIONS` gets `mockups` (7th, after Usage), `MANUAL_PAGES` gets `Mockups` (10th, after Usage's two pages). Both PDFs include it, since they draw every page (`export.md`). The export's warning about empty sections never lists Mockups: it always has content (its defaults), and an empty Logo section is already listed.

### Photo mockups (ADR 0014)
Built in three phases, each one usable on its own.

#### The photos the app ships
* Kept in `public/mockups/<id>.jpg`, with their license in `public/mockups/LICENSES.md` (source, author, license, link). Only photos with a **commercial license** are added.
* What a good photo is: at least **1500 px** across (1000 px is enough for a mockup up to about 85 mm wide in the print PDF); the product in **white or a light neutral color** (so it can be tinted); the place for the logo clearly visible; little else in the frame.
* Each photo has a **template**: `{ id, name, group, kind: 'photo', image, size: [w, h], mask, maskImage?, area, grid?, color, tintable }`, in `src/mockups/templates.ts`. `mask` is one or more polygons of the product in the photo's pixels, or `maskImage` a mask made in the editor; `area` is the box where the logo goes and `grid` its shape (see below); `color` is the default color; `tintable` is false for products that keep their own color (e.g. a wooden sign).
* In the list, photo templates sit in their group next to the illustrations, with a small **Photo** tag.
* **Photos for local tests only** (no license to ship them) are described in `public/mockups/local-templates.json`, in the same format the template editor downloads; that file and those photos are listed in `.gitignore`. The app reads the file when it starts, if it is there, and adds its templates for the session.
* The mask can be several polygons (e.g. the two cards of a photo of business cards), all tinted together.

#### How a photo mockup is drawn
* It is **composed in WebGL into a PNG image** (≈1500 px across, enough for the print PDF), and the page shows that image (`<img role="img" alt="<name> mockup">`). The PDF copies an image as it is (ADR 0012).
* **Tint** (if `tintable`): inside the mask, the photo's brightness times the product color, so folds and shadows stay.
* **Logo**: placed in its area, then blended with the photo:
  * **Printed** (default): the logo multiplies with the photo, so it looks printed and the folds show through it. Dark logos on light products.
  * **Solid**: the logo is laid over the photo, with the photo's shading on top. Light logos on dark products (a white logo would vanish with Printed). A hint says so.
* **The logo area** is a grid of points the user drags in the template editor (`grid`: 2 to 5 points across, 2 or 3 down): **four corners** mark an area at an angle (a card on a table), **more points across** follow a curve (the side of a mug). The logo is drawn on a mesh of small triangles bent smoothly through the points (Catmull-Rom curves), and keeps its proportions along the area's surface. A plain rectangle (`area` with no `grid`) is its four corners. The photo's brightness under the logo shades it.
* **Later, wrinkles**: a small displacement from the blurred brightness of the photo, to bend the logo with the fabric. Amount: 0–100 %, default 40 %.
* While a mockup is being drawn, its cell shows `Preparing…`. If it cannot be drawn (no WebGL, the photo does not load), the cell shows `This mockup could not be drawn` and the rest of the page works.

#### Placing the logo (photo mockups)
In the product's block of the section, above Color and Logo:
* A **preview** of that mockup, where the logo can be **dragged** inside its area (it never leaves it), or moved with the **arrow keys** (2 % of the area per press). While dragging, the logo follows the pointer as a plain image over the photo; the mockup is composed again when it is let go, so the drag stays smooth. Only the open block draws its preview.
* **Size** (20–150 %, step 5, default 100 %) and **Rotation** (−45° to 45°, step 5, default 0°) sliders, and **Reset** (centered, 100 %, 0°).
* **Blend**: Printed or Solid. (Later: **Amount** of the folds.)
* **Edit template**: opens the template editor with this photo.
* All of it is kept per product, like its color, and reaches the page at once.

#### The template editor
A window over the page, opened with **Edit template** in a photo mockup's block, or by **Upload your own photo** in the section (a JPG or PNG up to 10 MB; a new template of this session, ticked when used if there is room):
1. Choose a photo (JPG or PNG, up to 10 MB).
2. Select the **product**: the **Magic wand** selects, with one click, every connected pixel of a similar color (Tolerance 1–80 %, default 25 %); **New / Add / Subtract** (or Shift + click to add, Alt + click to take away). The **Brush** adds and the **Eraser** removes by painting (Brush size 4–120 px). The selection is shown in purple over the photo; **Undo** (up to 20 steps) and **Clear selection**. Its edge is softened (2 px) when the template is saved, so the tint does not end in a hard line. It is saved as a mask image (`maskImage`, white where the product is).
3. Mark the **logo area** with the **Logo area** tool: drag over the photo to draw it, then drag its points (the corners for an angle, the points in between for a curve). **Points across** (2–5) and **Points down** (2–3) add points along the current shape, without moving it.
4. Set the name, the group, the default color and whether it can be tinted; see the result with the current logo, live.
5. **Use now**: the template joins the list for this session. **Download template**: a JSON file (and the photo) to add to `templates.ts` and `public/mockups/`.

**Upload your own photo** in the Mockups section opens the same editor with that photo; its template lives in this session (ADR 0002).

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`).
* **Postconditions**: The Mockups page shows the ticked products, in the order of the list, each in its color and with its logo, and both PDFs have it as page 8.

## 4. Invariants
* 0 to 4 products are ticked, always in the order of the list.
* Every product, ticked or not, has a valid color and a logo version (or the Primary).
* A mockup never shows a gap: it shows a logo, or the dashed placeholder box.
* The logo never leaves its box (or its area, in a photo mockup) and keeps its proportions.
* A photo mockup is the same image in the preview and in both PDFs.
* Removing a logo version never makes a mockup show another version: one that used it shows the Primary.
* No two SVG elements on the page share an id.
* Template, Orientation, Preview view and Skin combine freely with the Mockups page.
* The choice is kept when the user moves between pages; it is only reset (to the four defaults, with default colors and the Primary) when the browser page is refreshed.

## Failure Modes
For photo mockups: `Preparing…` while drawing, `This mockup could not be drawn` when it fails (no WebGL, a photo that does not load), and in the editor a photo that is not an image or is over 10 MB is refused with `Use a JPG or PNG photo, up to 10 MB`. Otherwise, only a typed HEX can be wrong: it is flagged with `"Enter a valid HEX color, like #1E88E5"`, and the page keeps the last valid color. Everything else falls back: a missing logo to the next one in the chain, a removed version to the Primary, a 5th product to a disabled checkbox, a missing brand name to the Cover title or to no brand line.

## 5. Given-When-Then Test Criteria

### Scenario 1: Four Mockups by Default
* **Given**: The user opens the Brand Manual page and types "My Brand" as Brand name in the Logo section.
* **When**: The user looks at the Mockups page.
* **Then**: It shows "My Brand", the heading "Mockups", and the Business card, T-shirt, Mug and Phone in two rows of two, each with its caption and named for screen readers ("Business card mockup"…).

### Scenario 2: The Section
* **Given**: The user opens "7. Mockups".
* **When**: The section unfolds.
* **Then**: The Mockups page comes first in the preview; the 6 products are listed under Stationery, Apparel & bags, Objects and Screens; Business card, T-shirt, Mug and Phone are ticked, and their four blocks are below, folded.

### Scenario 3: Up to Four
* **Given**: Four products are ticked.
* **When**: The user looks at the list.
* **Then**: Letterhead and Tote bag are disabled, with "Up to 4 mockups."; unticking the Mug turns them on again, removes the Mug from the page, and the other three are laid out two and one.

### Scenario 4: The Order of the List
* **Given**: Business card, T-shirt and Phone are ticked.
* **When**: The user ticks the Letterhead.
* **Then**: The page shows Business card, Letterhead, T-shirt, Phone, and the Letterhead's block opens.

### Scenario 5: Color
* **Given**: The T-shirt is white.
* **When**: The user opens its block and picks Navy as its Product color.
* **Then**: The T-shirt on the page, and the drawing in its block header, turn Navy at once; the other mockups do not change.

### Scenario 6: The Phone's Icon Color
* **Given**: The Phone is ticked.
* **When**: The user opens its block.
* **Then**: The color field reads "Icon color", and changing it changes the app icon, not the phone's frame.

### Scenario 7: A Palette Color
* **Given**: The palette has Red.
* **When**: The user clicks "Use Red" under the Mug's Product color.
* **Then**: The Mug turns Red; changing Red in Colors later does not change it.

### Scenario 8: Logo Version
* **Given**: The Logo section has Version 1 "Horizontal" and a white Version 2 "Negative", both with images.
* **When**: The user opens the T-shirt's block.
* **Then**: The Logo select offers "Horizontal (Primary)" and "Negative"; choosing "Negative" and Navy shows the Negative image on the T-shirt, and the other mockups still show the Primary.

### Scenario 9: A Version with No Image Yet
* **Given**: The Mug's Logo is Version 2, which has no image.
* **When**: The user looks at the page and the Mug's block.
* **Then**: The Mug shows the Primary image (or the Cover logo, when the Primary has none), and its select still says Version 2; once Version 2 gets an image and Apply is clicked, the Mug shows it.

### Scenario 10: A Removed Version
* **Given**: The T-shirt's Logo is Version 3, and the Mug's is Version 2.
* **When**: The user removes Version 2 in the Logo section.
* **Then**: The T-shirt still shows the same version (now listed second); the Mug shows the Primary, and its select says Primary.

### Scenario 11: No Logo Yet
* **Given**: No logo was applied, in the Cover or the Logo section.
* **When**: The user looks at the Mockups page.
* **Then**: Every mockup shows a dashed placeholder box where its logo goes.

### Scenario 12: Unticked, Then Ticked Again
* **Given**: The Mug is Red, with Version 2.
* **When**: The user unticks the Mug and ticks it again.
* **Then**: The Mug is back on the page, still Red, with Version 2.

### Scenario 13: None Ticked
* **Given**: Business card, T-shirt, Mug and Phone are ticked.
* **When**: The user unticks all four.
* **Then**: The page shows "Choose mockups in the Mockups section".

### Scenario 14: No Brand Name
* **Given**: The Logo section's Brand name is empty, and the Cover title is "My Brand".
* **When**: The user looks at the Mockups page.
* **Then**: The header shows "My Brand"; with no Cover title either, it only shows "Mockups".

### Scenario 15: Templates and Orientation
* **Given**: Four mockups are ticked.
* **When**: The user selects Template 3 and Landscape.
* **Then**: The page shows the header in the side column and the four mockups, two rows of two, in the wide one, on a landscape page.

### Scenario 16: In the PDF
* **Given**: Four mockups are ticked and a logo is applied.
* **When**: The user downloads a PDF.
* **Then**: It has 10 pages, the last one the Mockups page as in the preview, with the logos visible and the products in their colors.

### Scenario 17: A Photo Template (phase 1)
* **Given**: The list has a photo template "T-shirt (photo)" and a logo is applied.
* **When**: The user ticks it.
* **Then**: The page shows "Preparing…" in its cell, then the photo with the logo printed on the chest, named "T-shirt (photo) mockup".

### Scenario 18: Tinting a Photo (phase 1)
* **Given**: "T-shirt (photo)" is white.
* **When**: The user picks Navy as its Product color.
* **Then**: The t-shirt in the photo turns navy, its folds and shadows still visible, and the background of the photo does not change.

### Scenario 19: Dragging the Logo (phase 1)
* **Given**: The block of "T-shirt (photo)" is open.
* **When**: The user drags the logo up and to the left, past the edge of its area, sets Size to 60 % and Rotation to 10°.
* **Then**: The logo stops at the edge of the area, is smaller and turned, on the page too; Reset puts it back in the middle at 100 % and 0°.

### Scenario 20: A White Logo on a Dark Product (phase 1)
* **Given**: "T-shirt (photo)" is navy with a white logo version.
* **When**: The user sets Blend to Solid.
* **Then**: The white logo shows, with the folds of the shirt shading it; with Printed it would vanish, which the hint explains.

### Scenario 21: An Area at an Angle, and a Curve
* **Given**: The template editor is open on a photo of a mug, with the Logo area tool.
* **When**: The user draws the area over the mug's side, sets Points across to 3 and drags the middle points down along the rim.
* **Then**: The area's lines bend with the rim; once used, the logo on the mockup follows the curve, and is darker where the mug is in shadow.

### Scenario 22: Curves and Folds (later)
* **Given**: A photo template of a mug with a 4 × 3 grid, and a t-shirt with Amount 40 %.
* **When**: The user looks at them, then sets the t-shirt's Amount to 0 %.
* **Then**: The logo wraps around the mug's curve, and bends with the shirt's folds; at 0 % it lies flat.

### Scenario 23: Making a Template
* **Given**: The user opens `Make a template` and chooses a photo of a tote bag.
* **When**: They click the bag with the Magic wand (Shift + click to add the handles), touch up the edge with the Brush, draw the logo area, name it "Tote (photo)" and click Use now.
* **Then**: "Tote (photo)" is in the list under Apparel & bags, with the Photo tag, and can be ticked like any product; Download template saves its JSON.

### Scenario 24: A Wrong Photo
* **Given**: The template editor is open.
* **When**: The user chooses a 12 MB PDF.
* **Then**: The editor shows "Use a JPG or PNG photo, up to 10 MB" and keeps the photo it had.

### Scenario 25: A Mockup That Cannot Be Drawn
* **Given**: The browser has no WebGL.
* **When**: A photo template is ticked.
* **Then**: Its cell shows "This mockup could not be drawn"; the illustrated mockups and the rest of the page work, and the PDF can still be made.

### Scenario 26: In the PDF
* **Given**: Two photo mockups and two illustrated ones are ticked.
* **When**: The user downloads the print PDF.
* **Then**: Page 8 shows the four as in the preview; the PDF waits until the photo mockups are drawn.

## Build Order
1. This spec and ADR 0013.
2. Stable ids for the logo versions (`LogoVariant.id`), with a test that removing a version keeps the others' ids.
3. The data and functions (`types.ts`, `products.ts`, `mockups.ts`), `MockupArt`, the page, the template CSS and the section, with **3 products** (Business card, T-shirt, Mug) and their tests.
4. Letterhead, Tote bag and Phone, each with a test of its data (the logo box inside the `viewBox`, at least one part painted with the product color).
5. README, PLAN.md.
6. Later: Envelope, Cap, Storefront sign, Bottle, Browser.
7. **Photo mockups** (ADR 0014), each phase tried before the next:
   1. Phase 1: templates, the WebGL renderer (tint, Printed/Solid), `PhotoMockup`, placing the logo (drag, Size, Rotation, Reset), with 2 photos from the user.
   2. Phase 2: four-corner perspective and shading.
   3. The template editor (magic wand, brush, area points with angles and curves) and uploads, brought forward after trying phase 1.
   4. Later: the folds (displacement).
