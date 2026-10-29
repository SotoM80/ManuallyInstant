# Technical Specification: Image Boxes

## 1. What it does
The boxes that hold the logo's images on the inner pages share one look, set once in the **Skin** section: their **Corner radius**, their **Inner margin** (the room between the image and the edge of the box) and their **Outline**. Changing one setting restyles every box on every inner page, in every template, the full screen view and both PDFs. The defaults are today's look (ADR 0022).

## Out of Scope
* Settings per box (a box's own corners, margin or outline). Each box may only have its own background color (`imagebackground.md`).
* The Cover logo, the Brand concept logo, the Clear space diagram (3.1) and the mockups.
* The outline's color (it stays the Page text color at 15 %), dashed outlines, shadows.
* Sizes in mm of the page.

## 2. Interface

### Group "Image boxes" (inside "6. Skin")
After the two page colors and before the layers, a group with the legend **Image boxes**:

| Control | Kind | Range | Default |
|---|---|---|---|
| **Corner radius** | slider, with its value (`4 px`) | 0–24 px, step 1 | 4 px |
| **Inner margin** | slider, with its value (`8 %`) | 0–20 %, step 1 | 8 % |
| **Outline** | checkbox | on / off | on |
| **Thickness** | slider, with its value (`1 px`) | 1–4 px, step 1 | 1 px |

* **Thickness** is disabled while Outline is off, and keeps its value.
* Every change reaches the pages at once (there is no Apply).
* The sliders have the same look and labels as a layer's sliders (`.skin-control`).

```
6. Skin
  Page background  [●] #FFFFFF
  Page text        [●] #000000
  Image boxes
    Corner radius  ───●────── 4 px
    Inner margin   ───●────── 8 %
    ☑ Outline
    Thickness      ●──────── 1 px
  + Add layer
```

### Which boxes
Every image box (`figure.logo-figure`) of the inner pages, except the Brand concept logo:
* Anatomy: every card and every part.
* Logo versions: the Primary and the other versions.
* Clear space 3.2: the box of the construction grid. The **Inner margin** moves an uploaded grid image; the grid drawn by the app keeps its own place (6 % in), so its rulers and guides do not move.
* Usage: every example. The ✓ / ✕ mark stays on the box's corner.

Not changed: the Cover logo, the Brand concept logo (it has no frame), the Clear space diagram of 3.1 (an SVG with its own dashed frame), the mockups and the Color palette chips.

### What each setting does
* **Corner radius**: the radius of the box's corners. 0 gives square corners. The background of the box (`imagebackground.md`) and its empty stripes follow the corners.
* **Inner margin**: the image sits that share of the box's width and height in from each side, and is fitted inside (`object-fit: contain`), as today. 0 lets the image touch the edges.
* **Outline**: a line inside the edge of the box (as today, so the box never grows), in the Page text color at 15 %, as thick as **Thickness**. Off: no line. An empty box keeps its stripes either way.

### In the code
* `src/skins/types.ts`: `Skin.boxes: { radius: number; margin: number; outline: boolean; outlineWidth: number }`. `NO_SKIN.boxes` is `{ radius: 4, margin: 8, outline: true, outlineWidth: 1 }`.
* `src/skins/boxes.ts`: pure helpers to change one setting and to turn `boxes` into CSS variables.
* `SkinForm.tsx`: the Image boxes group.
* `ManualPage.tsx`: sets `--box-radius`, `--box-margin` and `--box-outline` on every inner `article.manual-page` (not on the Cover).
* `src/templates/shared.css`: `.logo-figure` and `.logo-figure img` read the variables, with fallbacks equal to the defaults; `.concept-logo` does not.

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`), in the Skin section.
* **Postconditions**: Every image box of the inner pages has the chosen corners, margin and outline.

## 4. Invariants
* With the defaults, every page looks exactly as before.
* All image boxes of all inner pages always share the same settings.
* The settings never change the Cover, Brand concept, the 3.1 diagram or the mockups.
* The preview, the full screen view and both PDFs show the same boxes.
* Settings always stay in their ranges (they are only set with sliders and a checkbox).

## Failure Modes
None: every control always has a valid value.

## 5. Given-When-Then Test Criteria

### Scenario 1: Today's Look by Default
* **Given**: The user opens the Skin section.
* **When**: The user looks at Image boxes.
* **Then**: Corner radius is 4 px, Inner margin 8 %, Outline on and Thickness 1 px, and the boxes look as before.

### Scenario 2: Round Corners Everywhere
* **Given**: Logo versions, Anatomy and Usage show boxes.
* **When**: The user sets Corner radius to 12 px.
* **Then**: Every box of those pages, and the box of 3.2, has 12 px corners at once.

### Scenario 3: Square Corners
* **Given**: Corner radius is 4 px.
* **When**: The user sets it to 0.
* **Then**: Every box has square corners.

### Scenario 4: More Room Around the Logo
* **Given**: Version 1 shows an image.
* **When**: The user sets Inner margin to 15 %.
* **Then**: The image sits 15 % in from each side of its box, on every page.

### Scenario 5: No Outline
* **Given**: Outline is on.
* **When**: The user unticks Outline.
* **Then**: No box has an outline, empty boxes keep their stripes, and Thickness is disabled.

### Scenario 6: A Thicker Outline
* **Given**: Outline is on.
* **When**: The user sets Thickness to 3 px.
* **Then**: Every box has a 3 px outline inside its edge, and no box grows.

### Scenario 7: Brand Concept and 3.1 Stay
* **Given**: Brand concept shows the Cover logo and 3.1 shows the diagram.
* **When**: The user sets Corner radius to 20 px and Inner margin to 0.
* **Then**: The Brand concept logo and the 3.1 diagram do not change.

### Scenario 8: The Drawn Grid Stays in Place
* **Given**: 3.2 shows the grid drawn by the app.
* **When**: The user sets Inner margin to 20 %.
* **Then**: The drawn grid, its rulers and guides keep their place in the box.

### Scenario 9: With a Background
* **Given**: Version 2 has a black background (`imagebackground.md`).
* **When**: The user sets Corner radius to 16 px.
* **Then**: The black of Version 2 follows its round corners.

### Scenario 10: The Same in Every Template and in the PDF
* **Given**: Corner radius is 12 px and Outline is off.
* **When**: The user switches to Template 2 and 3, and downloads the web PDF.
* **Then**: Every template and the PDF show the same boxes as the preview.
