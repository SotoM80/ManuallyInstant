# Technical Specification: Line Weight

## 1. What it does
The lines of the manual get thicker or thinner from one place, the **Lines** group of the **Skin** section, with two sliders:
* **Decorative lines**: the lines that only divide or frame the page: the divider between the two columns of Template 3, the line between the two fonts of Template 3 and the faint outline of the Color palette chips.
* **Technical lines**: the lines that measure the logo on the Clear space page: the clear space diagram of 3.1 and the construction grid of 3.2 with its rulers and guides.

Changing one slider restyles those lines on every page, in every template, the full screen view and both PDFs. The defaults are today's lines, so with nothing changed every page looks exactly as before (ADR 0026).

## Out of Scope
* The outline of the image boxes: it has its own Thickness (`imageboxes.md`).
* The lines of the mockup illustrations (part of the drawing, `mockups.md`) and of the Skin's layers (Stripes, Waves…: they have their own sliders, `skins.md`).
* The grey or dashed frames shown while something is missing (an empty Brand concept logo, the logo spot of a photo mockup) and the ring of the ✓ / ✕ mark of the Usage examples.
* A weight per line, or per page or section. The color, opacity or dashes of the lines (their dashes keep their length).
* The invisible bands that make the guides of 3.2 easy to grab (`clearspace.md`): they keep their size.

## 2. Interface

### Group "Lines" (inside "6. Skin")
After the **Image boxes** group and before **Layer gallery**, a group with the legend **Lines**:

| Control | Kind | Range | Step | Default |
|---|---|---|---|---|
| **Decorative lines** | slider, with its value (`1 px`) | 0.5–4 px | 0.5 | 1 px |
| **Technical lines** | slider, with its value (`100 %`) | 50–300 % | 25 | 100 % |

* The sliders have the same look and labels as a layer's sliders (`.skin-control`).
* Every change reaches the pages at once (there is no Apply).

```
6. Skin
  Page background  [●] #FFFFFF
  Page text        [●] #000000
  Image boxes      (Corner radius, Inner margin, Outline, Thickness)
  Lines
    Decorative lines  ──●─────── 1 px
    Technical lines   ──●─────── 100 %
  Layer gallery ⌄
```

**Why two units:** the decorative lines are all 1 px today, so their slider is their real width. The technical lines have several weights on purpose (the grid at 0.6 px is finer than the logo's outline at 1.2 px), so their slider multiplies each one and keeps those differences.

### Which lines

| Line | Page | Today | With the slider |
|---|---|---|---|
| Divider between the two columns (Template 3) | every page with two columns in Template 3, the Cover included | 1 px | Decorative lines |
| Line between the two fonts (Template 3) | Typography | 1 px | Decorative lines |
| Outline of each color chip | Color palette | 1 px | Decorative lines |
| Edge of the clear space (dashed) | Clear space, 3.1 | 1 px | 1 px × Technical lines |
| Box around the logo | Clear space, 3.1 | 0.75 px | 0.75 px × Technical lines |
| Grid of modules | Clear space, 3.2 | 0.6 px | 0.6 px × Technical lines |
| Outline of the logo (dashed) | Clear space, 3.2 | 1.2 px | 1.2 px × Technical lines |
| X marks | Clear space, 3.2 | 0.75 px | 0.75 px × Technical lines |
| Rulers (dimension lines) | Clear space, 3.2 | 0.75 px | 0.75 px × Technical lines |
| Guides (dashed) | Clear space, 3.2 | 0.75 px | 0.75 px × Technical lines |

The lines keep their color (the Page text color, or the Cover's Text color on the Cover) and their opacity. The technical lines stay the same width at any size of the page (non-scaling strokes, as today).

### In the code
* `src/skins/types.ts`: `SkinLines = { decorative: number; technical: number }` (px and %), and the Skin's new optional field `lines?: SkinLines` (`NO_SKIN` has none: `{ decorative: 1, technical: 100 }`).
* `src/skins/lines.ts`: pure helpers to change one value and to turn the lines into CSS variables: `--line-decorative` (`1px`) and `--line-technical` (a factor: 150 % → `1.5`).
* `SkinForm.tsx`: the Lines group, after Image boxes.
* `ManualPage.tsx`: sets the two variables on every `article.manual-page`, **the Cover included** (the divider of Template 3 is on the Cover too).
* `src/templates/shared.css` and `template3.css`: each line above reads its variable, with today's value as fallback: `var(--line-decorative, 1px)`, `calc(0.6px * var(--line-technical, 1))`.

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`), in the Skin section.
* **Postconditions**: Every decorative line is as wide as Decorative lines, and every technical line is its width today × Technical lines, on every page.

## 4. Invariants
* At 1 px / 100 %, every page looks exactly as before.
* The technical lines always keep their differences: the grid is always finer than the logo's outline.
* The Lines group never changes the image boxes' outline, the Skin's layers, the mockups or any color.
* Decorative lines is between 0.5 and 4 in steps of 0.5; Technical lines between 50 and 300 in steps of 25.
* The lines are kept when the template, orientation, view or page order change, and when the user goes to Home and back. Nothing is saved between sessions (ADR 0002).

## Failure Modes
* **Sliders** cannot go past their limits; nothing can be typed, so there is no error message.

## 5. Given-When-Then Test Criteria

### Scenario 1: Today's Lines by Default
* **Given**: A new manual.
* **When**: The user opens the Skin section.
* **Then**: Decorative lines shows 1 px and Technical lines 100 %, and every line has its width of today.

### Scenario 2: Thicker Dividers
* **Given**: Template 3.
* **When**: The user sets Decorative lines to 3 px.
* **Then**: The divider between the columns is 3 px on every page with two columns, the Cover included; the line between the two fonts and the outline of the color chips are 3 px too; the Clear space lines do not change.

### Scenario 3: Thicker Technical Lines
* **Given**: The Clear space page with the grid drawn by the app.
* **When**: The user sets Technical lines to 200 %.
* **Then**: The grid is 1.2 px, the logo's outline 2.4 px, the X marks, rulers and guides 1.5 px, the clear space edge 2 px and the box around the logo 1.5 px; the dashes keep their length; the dividers do not change.

### Scenario 4: Thinner Technical Lines
* **Given**: The Clear space page.
* **When**: The user sets Technical lines to 50 %.
* **Then**: The grid is 0.3 px and the logo's outline 0.6 px.

### Scenario 5: The Image Boxes Keep Their Own Outline
* **Given**: Image boxes Outline on, Thickness 1 px.
* **When**: The user sets Decorative lines to 4 px and Technical lines to 300 %.
* **Then**: The outline of the image boxes is still 1 px.

### Scenario 6: The Guides Still Work
* **Given**: Technical lines at 300 %.
* **When**: The user drags a guide band of 3.2.
* **Then**: It moves as before (its grab band keeps its size).

### Scenario 7: Kept Between Pages
* **Given**: Decorative lines at 2 px and Technical lines at 150 %.
* **When**: The user goes to Home and back to the Brand Manual.
* **Then**: The pages and the sliders show the same values.

### Scenario 8: The Same in the PDF
* **Given**: Template 3, Decorative lines at 2.5 px and Technical lines at 200 %.
* **When**: The user makes the web PDF.
* **Then**: The lines look as in the preview.

## Build Order
1. Types, helpers and the CSS variables in `ManualPage`; the CSS reads them with today's values as fallbacks (Scenario 1).
2. The Lines group in `SkinForm` (Scenarios 1, 7).
3. Decorative and technical lines in the CSS (Scenarios 2–6).
4. The PDF (Scenario 8). `skins.md` points here.
