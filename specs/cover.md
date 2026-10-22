# Technical Specification: Cover Section

## 1. What it does
The first section of the Brand Manual page is **Cover** (portada). It collects everything shown on the cover page of the manual: the **brand manual title** (with its style), **Designed by** and the **logo**. The Cover page of the preview shows each of them as soon as it is typed or chosen; a new logo waits for the **Apply** button (see `brandmanual.md` and ADR 0007). Where each one sits on the page depends on the chosen template.

## Out of Scope
Choosing a template and the layout of each template (see `templates.md`). The Logo page and section (they will reuse this same logo later). Cropping or editing the logo (the Logo size field only scales it). The font and size of "Designed by" (its color is the Text color). Saving anything between sessions.

## 2. Interface
### Fields (in this order, all inside the "1. Cover" section)
1. **Brand manual title**: the text field and its three style fields (Font family, Font style, Font size). All the rules are in `titlefild.md`.
2. **Title color**: color picker for the brand manual title. Default Black `#000000`.
3. **Text color**: color picker for the rest of the text of the Cover ("Designed by"). Default Black `#000000`.
4. **Background color**: color picker for the background of the Cover. Default White `#FFFFFF`. The other pages have their own background, set in the Skin section (see `skins.md`).
5. **Designed by**: a free-text field (who designed the manual, e.g. a studio or a person).
6. **Logo**: a file field to upload the brand's logo. Accepted files: PNG, JPG, SVG or WebP, up to 5 MB. It is drawn as a **"Choose file"** button followed by the chosen file's name (or **"No file chosen"**), always in English: the browser's own file button follows the system language, so it is hidden (still used by the keyboard and screen readers).
7. **Logo size**: three buttons in a row, **Small**, **Medium** and **Large**, with one always chosen (default **Medium**). They scale the logo inside its area on the Cover: Small 50%, Medium 75%, Large 100% (the whole area). It never shows an error.
The section has no Save button: every change reaches the preview at once.

The three color pickers follow `colorpicker.md`.

The form follows the visual rules in `titlefild.md` (text aligned right).

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
* The title is drawn with its current style.
* The logo keeps its proportions and is never stretched.
* The logo is drawn at the current Logo size. A smaller logo stays in the same spot (centered, or in the top-left corner in Template 2) and never moves the title or "Designed by".
* "Designed by" is shown as `Designed by <name>`.

Each slot shows its placeholder while it is empty, in the same place: `Your brand manual title`, `Your logo` and `Designed by …`. The slots fill in one by one as the user types.

### Templates
The position of the title, logo and "Designed by" belongs to the template, not to the section. Each template only changes where these three elements sit on the page; the content is the same. See `templates.md`.

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`).
* **Postconditions**: The Cover page shows what is typed in the title and Designed by, and the last applied logo, placed by the current template.

## 4. Invariants
* Text, style, colors and Logo size reach the Cover at once. A new or replaced logo reaches it only after Apply; until then the Cover keeps the logo applied before (or its placeholder).
* The Cover always shows the three slots (content or placeholder), in the positions of the current template.
* The title, logo and "Designed by" always stay inside the page, with a margin around them and space between them, in both orientations and both preview views. Margins and spacing grow with the page (they are a percentage of its size). The logo is scaled to fit its space: bigger in Pages view, smaller in Grid view.
* The Logo size only shrinks the logo inside its area, so the logo never leaves the page, at any size.
* The logo applied here is the brand's only logo; the Logo page will use this same file.
* Nothing is stored between sessions: refreshing the browser clears the Cover.

## Failure Modes
No field is required: an empty field shows its placeholder on the Cover. A wrong file is flagged as soon as it is chosen, with a red border; it never turns Apply on, and the Cover keeps the logo it had:
* **Logo is not an image of an accepted type**: `"Use a PNG, JPG, SVG or WebP image"`.
* **Logo bigger than 5 MB**: `"The logo must be 5 MB or smaller"`.

The rules for an empty title and invalid style fields are in `titlefild.md`.

## 5. Given-When-Then Test Criteria

### Scenario 1: Live Preview
* **Given**: The user is on the Cover section.
* **When**: The user types the title "My Brand" and "Studio X" in Designed by.
* **Then**: The Cover shows "My Brand" at the top and "Designed by Studio X" at the bottom at once, with no button, and still shows the placeholder "Your logo".

### Scenario 2: Empty Fields
* **Given**: The Cover shows "My Brand".
* **When**: The user clears the title.
* **Then**: The Cover shows "Your brand manual title" again, and no error is shown.

### Scenario 3: A New Logo Waits for Apply
* **Given**: Apply is disabled.
* **When**: The user chooses a PNG logo.
* **Then**: Apply turns on and the Cover still shows "Your logo". When the user clicks Apply, the logo appears in the middle of the Cover and Apply is disabled again.

### Scenario 4: Replacing the Logo
* **Given**: The Cover shows an applied logo.
* **When**: The user chooses another PNG.
* **Then**: The Cover keeps the first logo until the user clicks Apply.

### Scenario 5: Wrong File Type
* **Given**: The user is on the Cover section.
* **When**: The user chooses a PDF as the logo.
* **Then**: Logo shows "Use a PNG, JPG, SVG or WebP image", Apply stays disabled and the Cover does not change.

### Scenario 6: File Too Big
* **Given**: The user is on the Cover section.
* **When**: The user chooses a PNG bigger than 5 MB.
* **Then**: Logo shows "The logo must be 5 MB or smaller", and Apply stays disabled.

### Scenario 7: Logo Size
* **Given**: The Cover shows an applied logo at Medium.
* **When**: The user chooses **Small** in Logo size.
* **Then**: The Cover draws the logo at 50% of its area at once, without Apply.
