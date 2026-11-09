# ADR 0026: Line spacing and line weight as CSS variables kept in the Skin

## Status
Accepted — 2026-11-09

## Context
Agencies want more control over two things that are fixed in the templates' CSS today:
* **Line spacing**: each kind of page has its own line height (the Cover title 1.15, the Typography page 1.2, the Color palette 1.25, the Logo pages 1.3, "Designed by" 1.45). They want to open or tighten titles and text, and not in the same way in every section.
* **Line weight**: the dividers of Template 3 and the chips' outlines are 1 px, and the Clear space lines go from 0.6 to 1.2 px. On a large print or a dark page they can look too thin or too heavy.

Options considered for **where the values live**:
* **A new App state** passed down to every page. This means new props through the preview, the full screen view and the export, right after the drafts refactor removed many of them.
* **In the Skin**, as `skin.sections` (ADR 0025) and `skin.boxes` (ADR 0022). The Skin already reaches every place a page is drawn, and it survives going to Home and back.

Options considered for **how the pages use them**:
* **Inline styles** on each text and line. This needs many components to change, and it does not reach the SVG lines drawn by CSS rules.
* **CSS variables** on each `article.manual-page`, read by the templates' CSS with today's values as fallbacks. This is how the image boxes already work.

Options considered for **the scale of the line spacing**:
* **An absolute line height** (e.g. 1.0–2.5). With one value per slider, every element of a section would get the same line height, so the differences of today would be lost.
* **A percentage of today's line height** (50–200 %). 100 % is exactly today, and each element keeps its proportion to the others.

Options considered for **the line weight**:
* **One multiplier** for every line. It is simple, but the dividers and the measuring lines play different roles.
* **A slider per kind of line** (divider, grid, rulers, guides…). It gives the most control, but makes a long form for a small effect.
* **Two sliders**: decorative lines in px (all 1 px today) and technical lines as a percentage (several weights today, kept apart on purpose).

## Decision
We will keep a **line spacing per section** (`skin.spacing`, Titles and Text, 50–200 % of today's line height) and a **line weight for the whole manual** (`skin.lines`, Decorative lines 0.5–4 px and Technical lines 50–300 %) in the **Skin**, as optional fields. `ManualPage` will turn them into CSS variables on every `article.manual-page`, **the Cover included** (`--title-leading`, `--text-leading`, `--line-decorative`, `--line-technical`). The templates' CSS will read the variables, with today's values as fallbacks.

* The line spacing is set in a folded **Line spacing** group at the end of each section's form, next to Section background (`linespacing.md`). The lines are set in a **Lines** group of the Skin section, after Image boxes (`lines.md`).
* The Cover takes both. ADR 0011 still holds: the Skin's **colors** never paint the Cover; spacing and line weight are not colors.
* Nothing is saved between sessions (ADR 0002). Templates still change only the layout (ADR 0004): every template reads the same variables.

## Consequences
* **+** With nothing changed, every page looks exactly as before: the fallbacks are today's values.
* **+** The preview, the full screen view and both PDFs show the change with no new prop, because they all draw `ManualPage` (ADR 0012).
* **+** It reuses what exists: the section loop and folded group of ADR 0025, the variables and sliders of ADR 0022, and `sectionOfPage`.
* **−** Every line height and line width in the templates' CSS must read its variable. A new text or line added later must remember to do it too, or it will not follow the sliders.
* **−** A high line spacing can push a long text past its block, where it is clipped as a long text is today. The app does not warn about it.
* **−** The Skin grows again (now also spacing and lines), and the six section forms get one more group each.
* **−** The two line sliders use different units (px and %), which the form must make clear.
