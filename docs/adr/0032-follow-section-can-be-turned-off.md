# ADR 0032: Following the open section can be turned off

## Status
Accepted — 2026-11-11

## Context
Opening a section brings its pages to the top of the preview, and the section to the top of its column beside them (`brandmanual.md`), so the page being edited is always in view. Some users find the moving pages distracting, and would rather keep the manual in its natural order, as in the PDF. The user asked to be able to turn this on or off.

Options considered:
* **A switch** in the preview toolbar, Follow section On | Off, On by default.
* **Three modes**: Move (today), Scroll (the preview scrolls to the page, nothing reorders) and Off.
* **No automatic move**: a button in each section's header brings its pages to the top on demand.

## Decision
We will add a **Follow section** group to the preview toolbar, after Template, with **On** (default, today's behavior) and **Off**. With Off, neither the pages nor the sections move, and the column is not pushed down; the open section's pages keep their accent outline. The choice is kept in `App`, like the orientation and the preview view.

## Consequences
* **+** Nothing changes for a user who never touches it.
* **+** Little new code: the order is already computed on every render (`orderPages`), so Off only asks for the natural order; the glide (`useReorderGlide`) and the alignment (`useAlignOpenSection`) simply have nothing to do.
* **+** A Scroll mode can be added later on top of it, without undoing anything.
* **−** With Off, a page far down (Mockups) must be scrolled to by hand.
* **−** One more control in an already full toolbar.
