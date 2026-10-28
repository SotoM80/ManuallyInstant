# Technical Specification: Export to PDF

## 1. What it does
Two buttons next to **Apply** download the whole manual as a PDF: one **for print** and one **for the web**. Both have every page of the manual, in its natural order, with the chosen template, orientation, skin and colors, as the preview shows them. They differ in resolution, weight, color space and which color values the Color palette page highlights. When the app has a CMYK server (`cmykserver.md`), the print PDF is in **real CMYK**; without one, it is RGB, as the web PDF always is.

## Out of Scope
* Vector PDFs (selectable text, embedded fonts): the pages are drawn as images (ADR 0012). Vector may come later.
* Black text in K only: in the CMYK print PDF, black and gray text are a mix of the four inks (ADR 0019).
* Output intents, PDF/X, or choosing the CMYK profile in the app.
* Bleed, crop marks, page numbers, a table of contents.
* Choosing which pages to export, or exporting one page.
* Saving the manual: it is only downloaded. In the CMYK print PDF, each page goes to the CMYK server and back, and the server keeps nothing (ADR 0018).

## 2. Interface
### Buttons
At the top of the sections column, on the right, in this order: **↓ Print PDF**, **↓ Web PDF**, **Apply**. Their accessible names are `Download print PDF` and `Download web PDF`.

| | Print PDF | Web PDF |
|---|---|---|
| Resolution | 300 dpi | 144 dpi |
| Image | PNG (no loss); with a CMYK server, CMYK pixels with no loss | JPEG (quality 0.82) |
| Color space | RGB; with a CMYK server, **CMYK** (the server's profile) | RGB |
| Color palette page | **CMYK** first and in bold, then HEX and RGB | **HEX** and **RGB** in bold, **CMYK** last and softer |
| File name | `<title>-print.pdf` | `<title>-web.pdf` |

The CMYK label on the Color palette page is `CMYK` or `CMYK ≈`, depending on where the values come from (see `colorpalette.md`). `<title>` is the manual title in lowercase, with every run of characters that are not letters or digits turned into `-` (e.g. `My Brand!` → `my-brand`), or `brand-manual` when there is no title. The print PDF can weigh several MB (the CMYK one about 1.3–2 times the RGB one); the web PDF is a fraction of it.

### Clicking a button
1. If a section was never touched (Cover, Logo, Usage, Colors or Typography still shows its placeholder; Usage counts while either of its pages does, see `usage.md`), a warning shows under the buttons: `Some pages are still empty: Logo, Typography.` with **Download anyway** and **Cancel**. Cancel closes it; Download anyway goes on.
2. While the PDF is made, both buttons are disabled and the one pressed reads `Creating… 3/10` (the page being drawn and the number of pages).
3. The browser downloads the file. The buttons are enabled again.
4. If something fails, a message shows under the buttons: `The PDF could not be created. Try again.`

### The print PDF with a CMYK server
When `VITE_CMYK_SERVER_URL` is set, **↓ Print PDF** works like this (the web PDF never changes):
1. The empty-sections warning, as above.
2. The app checks that the server answers (`GET /v1/health`, 3 s at most) **before** drawing any page.
3. The app gets the CMYK values of the palette from the server, so the Color palette page shows them before it is drawn.
4. Every page is drawn as today; the button reads `Creating… 3/10`.
5. Every page is sent to the server, one at a time; the button reads `Converting to CMYK… 3/10`. If the server is busy, the app tries once more after 2 s.
6. The browser builds the PDF from the CMYK pages and downloads it.

If the server cannot be reached, or stops answering during the export, no PDF is made and a dialog shows under the buttons: `The CMYK server cannot be reached, so the print PDF cannot be made in CMYK. Download it in RGB instead?`, with **Download RGB PDF** and **Cancel**. Download RGB PDF makes the print PDF as without a server; Cancel closes the dialog. Any other failure shows `The PDF could not be created. Try again.`

Apply has nothing to do with the export: the PDF shows what the preview shows, so an image still waiting for Apply is not in it.

### What each page looks like
* Every page is drawn as in the **Pages** view (titles at their real size), whatever view is chosen, at the size of an A4 page (`210 × 297 mm`, or `297 × 210 mm` in Landscape).
* No motion: pages are drawn at rest.
* The **guide bands** of the construction grid (3.2) are not drawn; the guides themselves are.
* The page outline and shadow of the preview, and the accent outline of the open section, are not drawn.

### In the code
* `src/export/exportSettings.ts`: the two kinds (`print`, `web`) with their resolution, image type and quality; `pdfFileName(title, kind)`; `emptySections(data)`. Pure, unit tested.
* `src/export/createPdf.ts`: draws each page element as an image (`html-to-image`) and adds it to an A4 PDF (`jsPDF`), one page per element, then downloads it. Both libraries are loaded only when a button is pressed, so the app does not get heavier. `createCmykPdf` draws the pages the same way, sends each one to the CMYK server and builds the PDF with `pdf-lib` (loaded only then), placing each page as a `DeviceCMYK` image with the bytes as they come (ADR 0019).
* `progressLabel(step, total)` in `src/export/exportSettings.ts`: `Creating… 3/10` or `Converting to CMYK… 3/10`. Pure, unit tested.
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
* Only the Color palette page differs between the two PDFs in what it shows; the CMYK print PDF also differs in color space.
* Making a PDF never changes the manual, the open section or the preview.
* Only one PDF is made at a time.
* The web PDF never calls the CMYK server.
* A print PDF is never half CMYK and half RGB: if the server fails during the export, no PDF is made.

## Failure Modes
* **Empty sections**: the warning above; the user may download anyway.
* **The PDF cannot be made** (an image or a font fails to load): `The PDF could not be created. Try again.`, and the buttons are enabled again.
* **The CMYK server cannot be reached** (before or during the export): the dialog above, with **Download RGB PDF** and **Cancel**, and the buttons are enabled again.

## 5. Given-When-Then Test Criteria

### Scenario 1: The Buttons
* **Given**: The user opens the Brand Manual page.
* **When**: The page loads.
* **Then**: "Download print PDF", "Download web PDF" and "Apply" are shown in that order, and the two download buttons are enabled.

### Scenario 2: A Complete Manual
* **Given**: Every section was touched; the title is "My Brand".
* **When**: The user clicks "Download print PDF".
* **Then**: A PDF named `my-brand-print.pdf` is made at 300 dpi in PNG, with the 10 pages in natural order, and no warning is shown.

### Scenario 3: The Web Version
* **Given**: Every section was touched.
* **When**: The user clicks "Download web PDF".
* **Then**: A PDF named `my-brand-web.pdf` is made at 144 dpi in JPEG.

### Scenario 4: Empty Sections
* **Given**: Only the Cover was touched.
* **When**: The user clicks "Download web PDF".
* **Then**: The warning says "Some pages are still empty: Logo, Usage, Colors, Typography." and no PDF is made until "Download anyway" is clicked; "Cancel" closes the warning.

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
* **Then**: Both buttons are disabled and the print one reads "Creating… n/10"; when it is done, both are enabled again.

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

### Scenario 12: Print PDF in CMYK
* **Given**: The app has a CMYK server that answers; every section was touched; the title is "My Brand".
* **When**: The user clicks "Download print PDF".
* **Then**: The button reads "Creating… n/10", then "Converting to CMYK… n/10", and a PDF named `my-brand-print.pdf` is downloaded with 10 A4 pages, each one a `DeviceCMYK` image.

### Scenario 13: The Server Cannot Be Reached
* **Given**: The app has a CMYK server address, but the server does not answer.
* **When**: The user clicks "Download print PDF".
* **Then**: No page is drawn, the dialog "The CMYK server cannot be reached…" is shown, and "Download RGB PDF" makes the print PDF in RGB; "Cancel" closes the dialog.

### Scenario 14: The Server Stops During the Export
* **Given**: The CMYK server answers at first, then fails on page 4.
* **When**: The user downloads the print PDF.
* **Then**: No PDF is downloaded, the same dialog is shown, and both buttons are enabled again.

### Scenario 15: The Web PDF Does Not Use the Server
* **Given**: The app has a CMYK server.
* **When**: The user clicks "Download web PDF".
* **Then**: The PDF is made as in Scenario 3, and the server is never called.

### Scenario 16: Profile Values on the Printed Palette
* **Given**: The app has a CMYK server with the FOGRA39 profile; the palette has `#1E88E5`.
* **When**: The user downloads the print PDF.
* **Then**: The Color palette page of the PDF shows the label `CMYK` with the server's values and the note "CMYK values for ISO Coated v2 (ECI)".
