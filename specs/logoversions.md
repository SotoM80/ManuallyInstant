# Technical Specification: Logo Versions

## 1. What it does
Part of the **Logo** section. The user lists the official versions of the logo (e.g. Horizontal, Vertical, Symbol only): from **1 to 4**, each with a **name**, what it is **used for** and an **image**. The first one is the **Primary** version. The **Logo versions** page of the preview shows them as chapter 2 of the Logo section, as soon as they are typed.

## Out of Scope
Colour rules per version (a version can show its image on a background of its own, see `imagebackground.md`, but the app does not make a negative or monochrome version from another). Editing or cropping the images. The Clear space page (see `clearspace.md`; its diagram uses the Primary version).

## 2. Interface
### Form (group "Versions" of the Logo section)
Each version is a block of an accordion, like the colors of the Colors section (see `colorpalette.md`): only one is open; a folded one shows its name and its file name.
* **Version N name**: free text, e.g. "Horizontal".
* **Version N use for**: the end of the sentence "Use the … version …", e.g. "for web and long stationery".
* **Version N image**: PNG, JPG, SVG or WebP, up to 5 MB. A new image waits for its own **Apply**, next to the field (`Apply Version N image`; see `brandmanual.md` and ADR 0020).
* **More** under the image: the version's **Background** color, none by default (see `imagebackground.md`).
* **Remove** (only when there is more than one version) and **Add version** (disabled at 4).
* Version 1 is marked **· Primary**.

### Logo versions page
* Header: the brand name and the heading "Logo versions".
* **2.1 Primary version**: the image of Version 1, its name and the sentence "The {name} version is the master configuration of {brand}. It is the default choice in every application, and the other versions are only used where it does not fit."
* **2.2 Other versions**: versions 2 to 4, each with its image and name. Hidden when there is only one version.
* **2.3 Usage**: one sentence per version that has a "use for": "Use the {name} version {use for}."
* The template's CSS decides where each block sits.

### Empty fields (live preview)
The page never shows a sentence with a gap:
* A version with no name is shown as **"Primary"** (Version 1) or **"Version N"**.
* With no brand name, the sentence says "the brand".
* A version with no "use for" has no usage sentence. When none has one, 2.3 shows the placeholder `Where each version is used`.
* Version 1 with no image shows the **logo applied in the Cover section**. Versions 2 to 4 with no image show an empty box.
* Until the Logo section is touched, the page shows the placeholder `Your logo versions`.

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`), in the Logo section.
* **Postconditions**: The Logo versions page shows every version with its name and its last applied image, and the usage of each version that has one.

## 4. Invariants
* Every version has a stable id (kept while it exists, never reused), so what points at a version (a mockup, see `mockups.md`) keeps pointing at it when others are removed.
* There are always between 1 and 4 versions; the first one is always the Primary.
* Text reaches the page at once; a new image only after its Apply.
* The page keeps the order of the form.

## Failure Modes
No field is required. A wrong file is flagged as soon as it is chosen, with a red border; it never turns its Apply on, and the page keeps the image it had:
* **Not an image of an accepted type**: `"Use a PNG, JPG, SVG or WebP image"`.
* **Bigger than 5 MB**: `"The logo must be 5 MB or smaller"`.

## 5. Given-When-Then Test Criteria

### Scenario 1: Live Versions
* **Given**: The Logo section is open, with the brand name "VOLTA".
* **When**: The user names Version 1 "Horizontal" and types "for web and long stationery" in its use for.
* **Then**: The page shows "The Horizontal version is the master configuration of VOLTA." and "Use the Horizontal version for web and long stationery." at once.

### Scenario 2: The Cover Logo as Primary
* **Given**: A Cover logo is applied and Version 1 has no image.
* **When**: The user looks at the Logo versions page.
* **Then**: 2.1 shows the Cover logo. After the user chooses an image for Version 1 and clicks "Apply Version 1 image", it shows that image instead.

### Scenario 3: No Gaps While Typing
* **Given**: The brand name and the version names are empty, and only Version 2 has a use for ("for app icons").
* **When**: The user looks at the page.
* **Then**: It shows "The Primary version is the master configuration of the brand.", "Version 2" and "Use the Version 2 version for app icons."

### Scenario 4: No Usage Yet
* **Given**: No version has a use for.
* **When**: The user looks at the page.
* **Then**: 2.3 shows "Where each version is used".

### Scenario 5: Other Versions
* **Given**: There are two versions, "Horizontal" and "Symbol only", with their images applied.
* **When**: The user looks at the page.
* **Then**: 2.1 shows Horizontal, 2.2 shows Symbol only, and 2.3 shows a usage sentence for each one.
