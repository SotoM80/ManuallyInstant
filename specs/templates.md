# Technical Specification: Templates

## 1. What it does
The user picks one of three templates for the manual: **Template 1**, **Template 2** or **Template 3**. A template decides **where** the content sits on each page of the manual. It never changes **what** the content is: the title, logo, "Designed by" and their styles are the same in every template.

## Out of Scope
The Color palette and Typography layouts are in `colorpalette.md` and `typography.md`. Creating or editing templates from the app. Template colors, decorations or fonts beyond the layouts below.

## 2. Interface
### Selector
In the preview toolbar, next to "Page orientation" and "Preview view": a group labeled **"Template"** with three options, **Template 1** (selected by default), **Template 2** and **Template 3**. Choosing an option changes the preview immediately.

### Cover layouts
```
Template 1             Template 2               Template 3
┌──────────────┐       ┌──────────────┐         ┌──────────────┐
│   MY BRAND   │       │[logo]        │         │MY    │       │
│              │       │              │         │BRAND │       │
│    [LOGO]    │       │              │         │      │[LOGO] │
│              │       │              │         │      │       │
│ Designed by X│       │MY BRAND      │         │By X  │       │
└──────────────┘       │Designed by X │         └──────┴───────┘
                       └──────────────┘
```
* **Template 1**: title at the top, logo big in the center, "Designed by" at the bottom. Everything centered.
* **Template 2**: small logo in the top-left corner, empty space, then the title and "Designed by" at the bottom. Everything aligned left.
* **Template 3**: a **side column** on every page. On the Cover: the title at the top of the narrow left column, "Designed by" at its bottom, a faint vertical line, and the logo big in the wide right column. Text aligned left.

### Template 3 on every page
Template 3 is built on a side column, so it looks different from Templates 1 and 2 (which stack everything from top to bottom). Every page is split into a narrow column on the left (30%) and a wide one on the right, with a faint vertical line between them:
* **Left**: what the page is about: the title and "Designed by" on the Cover, the heading (and the CMYK note) on Color palette and Typography, the brand name and heading on the Logo pages.
* **Right**: the content: the logo, the colors, the fonts, or the numbered blocks of the Logo pages (1.1, 2.1, 2.2…).

See `colorpalette.md` and `typography.md` for their diagrams.

While a slot is empty, its placeholder ("Your brand manual title", "Your logo", "Designed by …") sits in the same place.

### Structure in the code
Each template has its own folder in `src/templates/` (`template1/`, `template2/`, `template3/`) with the CSS that places the content. Every template uses the same page markup; `src/templates/index.ts` lists the templates in the order of the selector.

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`).
* **Postconditions**: After choosing a template, every page of the preview uses its layout.

## 4. Invariants
* All the pages always use the same template.
* Changing the template never changes, loses or requires saving the content again.
* Template, page orientation and preview view combine freely: every template works in Portrait and Landscape, in Grid and Pages view.
* In every combination, the title, logo and "Designed by" stay inside the page, with margins.
* The chosen template is kept when the user moves between pages. It is only reset (to Template 1) when the browser page is refreshed.

## 5. Given-When-Then Test Criteria

### Scenario 1: Template 1 by Default
* **Given**: The user opens the Brand Manual page.
* **When**: The page loads.
* **Then**: The Template group offers Template 1, Template 2 and Template 3, in that order, and Template 1 is selected.

### Scenario 2: Changing the Template
* **Given**: The Cover shows "My Brand", an applied logo and "Studio X".
* **When**: The user selects Template 2 (or Template 3).
* **Then**: The new template is selected and applied at once, and the Cover still shows "My Brand", the logo and "Designed by Studio X".

### Scenario 3: Template Is Kept Between Pages
* **Given**: The user selected Template 3.
* **When**: The user goes to Home and then back to Brand Manual.
* **Then**: Template 3 is still selected and applied.

### Scenario 4: Template, Orientation and View Combine
* **Given**: The user selected Template 2.
* **When**: The user selects Landscape and Pages.
* **Then**: The preview uses Template 2, landscape pages and the Pages view at the same time.
