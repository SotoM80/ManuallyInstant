# Technical Specification: Export to PDF

## 1. What it does
Two buttons next to **Apply** download the whole manual as a PDF: one **for print** and one **for the web**. Both have every page of the manual, in its natural order, with the chosen template, orientation, skin and colors, as the preview shows them. They differ in resolution, weight, and which color values the Color palette page highlights.

## Out of Scope
* Vector PDFs (selectable text, embedded fonts): the pages are drawn as images (ADR 0012). Vector may come later.
* Real CMYK: both PDFs are RGB; CMYK is only shown as approximate values (ADR 0003).
* Bleed, crop marks, page numbers, a table of contents.
* Choosing which pages to export, or exporting one page.
* Saving the manual or sending the PDF anywhere: it is only downloaded (ADR 0002).

## 2. Interface
### Buttons
At the top of the sections column, on the right, in this order: **↓ Print PDF**, **↓ Web PDF**, **Apply**. Their accessible names are `Download print PDF` and `Download web PDF`.

| | Print PDF | Web PDF |
|---|---|---|
| Resolution | 300 dpi | 144 dpi |
| Image | PNG (no loss) | JPEG (quality 0.82) |
| Color palette page | **CMYK ≈** first and in bold, then HEX and RGB | **HEX** and **RGB** in bold, **CMYK ≈** last and softer |
| File name | `<title>-print.pdf` | `<title>-web.pdf` |

`<title>` is the manual title in lowercase, with every run of characters that are not letters or digits turned into `-` (e.g. `My Brand!` → `my-brand`), or `brand-manual` when there is no title. The print PDF can weigh several MB; the web PDF is a fraction of it.

### Clicking a button
1. If a section was never touched (Cover, Logo, Colors or Typography still shows its placeholder), a warning shows under the buttons: `Some pages are still empty: Logo, Typography.` with **Download anyway** and **Cancel**. Cancel closes it; Download anyway goes on.
2. While the PDF is made, both buttons are disabled and the one pressed reads `Creating… 3/8` (the page being drawn and the number of pages).
3. The browser downloads the file. The buttons are enabled again.
4. If something fails, a message shows under the buttons: `The PDF could not be created. Try again.`

Apply has nothing to do with the export: the PDF shows what the preview shows, so an image still waiting for Apply is not in it.

### What each page looks like
* Every page is drawn as in the **Pages** view (titles at their real size), whatever view is chosen, at the size of an A4 page (`210 × 297 mm`, or `297 × 210 mm` in Landscape).
* No motion: pages are drawn at rest.
* The **guide bands** of the construction grid (3.2) are not drawn; the guides themselves are.
* The page outline and shadow of the preview, and the accent outline of the open section, are not drawn.

### In the code
* `src/export/exportSettings.ts`: the two kinds (`print`, `web`) with their resolution, image type and quality; `pdfFileName(title, kind)`; `emptySections(data)`. Pure, unit tested.
* `src/export/createPdf.ts`: draws each page element as an image (`html-to-image`) and adds it to an A4 PDF (`jsPDF`), one page per element, then downloads it. Both libraries are loaded only when a button is pressed, so the app does not get heavier.
* Before drawing, the export waits until the copy has not changed for 300 ms (at most 4 s): the construction grid reads the logo's pixels in the background and then redraws itself.
* `src/export/inlineSvgStyles.ts`: then writes every computed property (fill, stroke, `vector-effect`, opacity, font size…) of every SVG shape and text of the copy on the element itself, because html-to-image copies an SVG without the styles its CSS gives it. Without it, the construction grid and the clear space diagram come out filled in black.
* `ManualPage`: one page of the manual (its background, skin and content), shared by the preview and the export.
* `ExportPages`: an off-screen copy of every page, in natural order, mounted only while a PDF is made.
* `ColorPalettePage` gets `emphasis` (`print`, `web`, or none in the preview).

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`).
* **Postconditions**: The browser has downloaded one PDF with one A4 page per page of the manual, in natural order, in the chosen orientation.

## 4. Invariants
* The PDF always has every page of the manual, in its natural order, whatever section is open.
* The PDF shows the same content, template, skin, colors and orientation as the preview.
* Only the Color palette page differs between the two PDFs.
* Making a PDF never changes the manual, the open section or the preview.
* Only one PDF is made at a time.

## Failure Modes
* **Empty sections**: the warning above; the user may download anyway.
* **The PDF cannot be made** (an image or a font fails to load): `The PDF could not be created. Try again.`, and the buttons are enabled again.

## 5. Given-When-Then Test Criteria

### Scenario 1: The Buttons
* **Given**: The user opens the Brand Manual page.
* **When**: The page loads.
* **Then**: "Download print PDF", "Download web PDF" and "Apply" are shown in that order, and the two download buttons are enabled.

### Scenario 2: A Complete Manual
* **Given**: Every section was touched; the title is "My Brand".
* **When**: The user clicks "Download print PDF".
* **Then**: A PDF named `my-brand-print.pdf` is made at 300 dpi in PNG, with the 8 pages in natural order, and no warning is shown.

### Scenario 3: The Web Version
* **Given**: Every section was touched.
* **When**: The user clicks "Download web PDF".
* **Then**: A PDF named `my-brand-web.pdf` is made at 144 dpi in JPEG.

### Scenario 4: Empty Sections
* **Given**: Only the Cover was touched.
* **When**: The user clicks "Download web PDF".
* **Then**: The warning says "Some pages are still empty: Logo, Colors, Typography." and no PDF is made until "Download anyway" is clicked; "Cancel" closes the warning.

### Scenario 5: Highlighted Values
* **Given**: The palette has one color.
* **When**: A print PDF and a web PDF are made.
* **Then**: The print one's Color palette page lists CMYK ≈ first, highlighted; the web one's highlights HEX and RGB and lists CMYK ≈ last.

### Scenario 6: Natural Order
* **Given**: The Typography section is open, so its page is first in the preview.
* **When**: The user downloads a PDF.
* **Then**: The PDF starts with the Cover and ends with Typography.

### Scenario 7: Landscape
* **Given**: Landscape is chosen.
* **When**: The user downloads a PDF.
* **Then**: Every page of the PDF is A4 landscape.

### Scenario 8: While a PDF Is Made
* **Given**: The user clicked "Download print PDF".
* **When**: The PDF is being made.
* **Then**: Both buttons are disabled and the print one reads "Creating… n/8"; when it is done, both are enabled again.

### Scenario 9: A Failure
* **Given**: Drawing a page fails.
* **When**: The user clicks "Download web PDF".
* **Then**: "The PDF could not be created. Try again." is shown and both buttons are enabled again.

### Scenario 10: No Guide Bands
* **Given**: 3.2 shows the grid drawn by the app, with one guide.
* **When**: A PDF is made.
* **Then**: The Clear space page of the PDF has the guide, but not the clickable bands.

### Scenario 11: The Clear Space Page Keeps Its Look
* **Given**: The Clear space page shows the logo with its dashed frame, the grid drawn by the app and its measures in X.
* **When**: A PDF is made.
* **Then**: The page in the PDF looks like the preview: thin lines and a dashed frame in the Page text color, the faded logo visible through them, and the measures at their size, never filled in black.
