# Technical Specification: Cover Section

## 1. What it does
The first section of the Brand Manual page is **Cover** (portada). It collects everything shown on the cover page of the manual: the **brand manual title** (with its style), **Designed by** and the **logo**. After the user clicks Save, the Cover page of the preview shows the three of them. Where each one sits on the page depends on the chosen template.

## Out of Scope
Choosing a template and the layout of each template (see `templates.md`). The Logo page and section (they will reuse this same logo later). Cropping, resizing or editing the logo. Styling "Designed by" (font, color, size). Saving anything between sessions.

## 2. Interface
### Fields (in this order, all inside the "1. Cover" section)
1. **Brand manual title**: the text field and its three style fields (Font family, Font style, Font size). All the rules are in `titlefild.md`.
2. **Typography color**: color picker for the title and "Designed by". Default Black `#000000`.
3. **Background color**: color picker for the background of every page of the manual. Default White `#FFFFFF`.
4. **Designed by**: a free-text field (who designed the manual, e.g. a studio or a person).
5. **Logo**: a file field to upload the brand's logo. Accepted files: PNG, JPG, SVG or WebP, up to 5 MB.
6. **Save** button.

The two color pickers follow `colorpicker.md`.

The form follows the visual rules in `titlefild.md` (text aligned right, Save button only as wide as its label).

### Cover page in the preview — Template 1 (default)
The layouts of Template 2 and Template 3 are in `templates.md`.
```
┌──────────────┐
│   MY BRAND   │  ← brand manual title, top
│              │
│    [LOGO]    │  ← logo, centered
│              │
│ Designed by  │  ← "Designed by <name>", small, bottom
│   Studio X   │
└──────────────┘
```
* The title is drawn with its saved style.
* The logo keeps its proportions and is never stretched.
* "Designed by" is shown as `Designed by <name>`.

Before the first Save the Cover shows placeholders in the same places: `Your brand manual title`, `Your logo` and `Designed by …`.

### Templates
The position of the title, logo and "Designed by" belongs to the template, not to the section. Each template only changes where these three elements sit on the page; the content is the same. See `templates.md`.

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`).
* **Postconditions**: After a valid Save, the Cover page shows the title, the logo and "Designed by <name>", placed by the current template.

## 4. Invariants
* The Cover changes only when the user clicks Save, never while typing or choosing a file.
* The Cover always shows the three slots (content or placeholder), in the positions of the current template.
* The title, logo and "Designed by" always stay inside the page, with a margin around them and space between them, in both orientations and both preview views. Margins and spacing grow with the page (they are a percentage of its size). The logo is scaled to fit its space: bigger in Pages view, smaller in Grid view.
* The logo saved here is the brand's only logo; the Logo page will use this same file.
* Nothing is stored between sessions: refreshing the browser clears the Cover.

## Failure Modes
All three fields are required. On Save, every invalid field shows its error at the same time, with a red border, and nothing is saved:
* **Designed by empty** (or only spaces): `"Required field"`.
* **No logo chosen**: `"Required field"`.
* **Logo is not an image of an accepted type**: `"Use a PNG, JPG, SVG or WebP image"`. Shown as soon as the file is chosen.
* **Logo bigger than 5 MB**: `"The logo must be 5 MB or smaller"`. Shown as soon as the file is chosen.

The rules for an empty title and invalid style fields are in `titlefild.md`.

## 5. Given-When-Then Test Criteria

### Scenario 1: Successful Save
* **Given**: The user typed the title "My Brand", "Studio X" in Designed by and chose a PNG logo.
* **When**: The user clicks Save.
* **Then**: The Cover shows "My Brand" at the top, the logo in the middle and "Designed by Studio X" at the bottom, in that order.

### Scenario 2: Designed By Is Required
* **Given**: The user typed a title and chose a logo, but Designed by is empty.
* **When**: The user clicks Save.
* **Then**: Designed by shows "Required field" with a red border, and the Cover does not change.

### Scenario 3: Logo Is Required
* **Given**: The user typed a title and Designed by, but did not choose a logo.
* **When**: The user clicks Save.
* **Then**: Logo shows "Required field", and the Cover does not change.

### Scenario 4: Wrong File Type
* **Given**: The user is on the Cover section.
* **When**: The user chooses a PDF as the logo.
* **Then**: Logo shows "Use a PNG, JPG, SVG or WebP image", and Save is blocked.

### Scenario 5: File Too Big
* **Given**: The user is on the Cover section.
* **When**: The user chooses a PNG bigger than 5 MB.
* **Then**: Logo shows "The logo must be 5 MB or smaller", and Save is blocked.

### Scenario 6: Cover Waits for Save
* **Given**: The user is on the Brand Manual page and has never saved.
* **When**: The user types Designed by and chooses a logo, without clicking Save.
* **Then**: The Cover still shows the placeholders "Your logo" and "Designed by …".
