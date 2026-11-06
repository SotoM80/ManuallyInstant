# ADR 0025: A background for each section

## Status
Accepted — 2026-11-06

## Context
The Skin paints every inner page the same way: one Page background, one Page text color and up to 4 layers (`specs/skins.md`, ADRs 0009, 0010, 0023). Its spec leaves "a different skin on each page" out of scope. Agencies want some parts of the manual to stand apart, for example the Color palette on a dark background or the Mockups over a photo of the brand's world, without losing the Skin's decoration.

Options considered:
* **A background per page** (10 pages): the most control, but 10 sets of controls, and the 4 Logo pages or the 2 Usage pages would usually be set to the same thing by hand.
* **A whole Skin per section**: each section with its own colors and layers. Very flexible, but it multiplies the Skin form by six and breaks the idea of one look for the manual.
* **A background per section, under the Skin's layers**: each section can replace only the Page background, with a color and an optional picture with its own opacity. The Skin's layers and Page text stay the same everywhere.

## Decision
We will give each section of the manual (Cover, Logo, Usage, Colors, Typography, Mockups) an optional **section background**: a **color**, a **picture** with its **Fit** (Cover / Contain) and its **opacity**, set in a folded **Section background** group at the end of that section's form. Every page of the section shows it. It takes the place of the Skin's Page background only. The Skin's layers are still drawn over it, and the Page text color does not change.

* **Order on a page**, from back to front: the section color (or the Skin's Page background when the section has none) → the section picture, at its opacity → the Skin's layers → the content.
* **The Cover** keeps its own Background color (ADR 0011). Its group has the picture, Fit and opacity only.
* **The picture** is drawn as an SVG `<image>` the size of the page, like an Image layer (ADR 0023), and its new file waits for its own Apply (ADR 0020). The color is always solid; only the picture has an opacity, so the color shows through it.
* **The PDF** checks every section picture before drawing, as it checks the Skin's pictures (ADR 0023).
* The section backgrounds are kept **in the Skin** (`skin.sections`), since they are part of how the pages look. The Skin already reaches every place a page is drawn (preview, full screen, PDF), so no new state or prop is needed, and they survive going to Home and back with it. Nothing is saved between sessions (ADR 0002).
* The picture is the lowest group of the Skin's SVG, so the PDF's picture check (ADR 0023) covers it as it is.

This narrows the Skin's out-of-scope "a different skin on each page": a section can change its background, never its layers or text color. ADRs 0004 (templates change layout, not content) and 0011 (Cover colors only paint the Cover) still hold.

## Consequences
* **+** A section can stand apart (a dark palette page, a photo behind the mockups) while the manual keeps one Skin.
* **+** It reuses what exists: the Skin's color field and palette chips, the image field with its Apply, the `<image>` drawing and the PDF check of ADR 0023.
* **+** With no section background set, every page looks exactly as before.
* **−** The Page text color is the same for every section, so a dark section background with dark text is hard to read. The app does not warn about it (as in `skins.md`).
* **−** Six more groups in the forms, which now change a part of the Skin: every change must start from the newest Skin, or two quick changes could undo each other.
* **−** The Skin grows: it now also holds something of the Cover and of each section, not only of the inner pages as a whole.
* **−** A full-page photo makes the print PDF much heavier, as with the Image layer (ADR 0023).
