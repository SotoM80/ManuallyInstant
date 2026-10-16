# Technical Specification: Mockups

## 1. What it does
A **Mockups** section and a new page, **8. Mockups**, that show the brand's logo applied to products: a business card, a t-shirt, a mug, a phone screen… The user chooses **up to 4** products from a list of 6, and for each one its **color** and **which version of the logo** it carries (a white version on a dark product, for example). The products are flat illustrations drawn by the app, so they can take any color and stay sharp in both PDFs.

## Out of Scope
* **More products** (Envelope, Cap, Storefront sign, Bottle, Browser): later, one at a time, each with its own scenario. This version has 6.
* Photos of products, or uploading your own product photo (ADR 0013).
* Perspective or curved logos (a logo wrapping around a mug): the logo always sits flat in its box.
* Blend modes to make the logo look printed or embroidered.
* Warnings when the logo and the product have the same or a similar color (a white logo on a white t-shirt): as with the palette (`colorpalette.md`), contrast is the designer's call.
* Fitting very wide or very tall logos better: a logo keeps its proportions in its box, so a very long one can look small.
* More than 4 mockups, a page per mockup, or choosing their order (they follow the order of the list).
* Text on the products (a name or a phone number on the business card), or the brand fonts on them.
* Saving the choice between sessions (ADR 0002).

## 2. Interface
### Section "6. Mockups"
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
* `MANUAL_SECTIONS` gets `mockups` (6th), `MANUAL_PAGES` gets `Mockups` (8th). Both PDFs include it, since they draw every page (`export.md`). The export's warning about empty sections never lists Mockups: it always has content (its defaults), and an empty Logo section is already listed.

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`).
* **Postconditions**: The Mockups page shows the ticked products, in the order of the list, each in its color and with its logo, and both PDFs have it as page 8.

## 4. Invariants
* 0 to 4 products are ticked, always in the order of the list.
* Every product, ticked or not, has a valid color and a logo version (or the Primary).
* A mockup never shows a gap: it shows a logo, or the dashed placeholder box.
* The logo never leaves its box and keeps its proportions.
* Removing a logo version never makes a mockup show another version: one that used it shows the Primary.
* No two SVG elements on the page share an id.
* Template, Orientation, Preview view and Skin combine freely with the Mockups page.
* The choice is kept when the user moves between pages; it is only reset (to the four defaults, with default colors and the Primary) when the browser page is refreshed.

## Failure Modes
Only a typed HEX can be wrong: it is flagged with `"Enter a valid HEX color, like #1E88E5"`, and the page keeps the last valid color. Everything else falls back: a missing logo to the next one in the chain, a removed version to the Primary, a 5th product to a disabled checkbox, a missing brand name to the Cover title or to no brand line.

## 5. Given-When-Then Test Criteria

### Scenario 1: Four Mockups by Default
* **Given**: The user opens the Brand Manual page and types "My Brand" as Brand name in the Logo section.
* **When**: The user looks at the Mockups page.
* **Then**: It shows "My Brand", the heading "Mockups", and the Business card, T-shirt, Mug and Phone in two rows of two, each with its caption and named for screen readers ("Business card mockup"…).

### Scenario 2: The Section
* **Given**: The user opens "6. Mockups".
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
* **Then**: It has 8 pages, the last one the Mockups page as in the preview, with the logos visible and the products in their colors.

## Build Order
1. This spec and ADR 0013.
2. Stable ids for the logo versions (`LogoVariant.id`), with a test that removing a version keeps the others' ids.
3. The data and functions (`types.ts`, `products.ts`, `mockups.ts`), `MockupArt`, the page, the template CSS and the section, with **3 products** (Business card, T-shirt, Mug) and their tests.
4. Letterhead, Tote bag and Phone, each with a test of its data (the logo box inside the `viewBox`, at least one part painted with the product color).
5. README, PLAN.md.
6. Later: Envelope, Cap, Storefront sign, Bottle, Browser.
