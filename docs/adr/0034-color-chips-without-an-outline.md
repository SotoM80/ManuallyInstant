# ADR 0034: The color chips' outline can be turned off, from the Colors section

## Status
Accepted — 2026-11-12

## Context
Every chip of the Color palette page has a faint outline (`colorpalette.md`), so a color equal to the page background is still visible. Its width is the Skin's **Decorative lines** (ADR 0026), which also draws the dividers of Template 3, so it cannot be used to remove only the chips' outline. The user wants to be able to remove it.

Options considered for the control:
* A **Chip outline** checkbox in the Skin's **Lines** group, beside Decorative lines.
* A **Chip outline** checkbox in the **Colors** section, where the colors are worked on.

And for where the choice is kept:
* In the **palette** (each color, or the list): it would change the palette's type, which the Skin, Logo, Usage and Mockups pickers all read.
* In a new state in `App`, passed down to every page, the Full screen view and both PDFs.
* In the **Skin**, as an optional `chipOutline?` (missing → on), like `lines`, `spacing` and `footer` (ADR 0026, 0031): the Skin already reaches every page, view and PDF.

## Decision
The user chose the **Colors** section for the checkbox. The choice is kept in the **Skin** as `chipOutline?: boolean`, missing meaning on; the Colors form reads and writes it. With it off, the chips of the Color palette page have no outline; the form's own chips do not change.

## Consequences
* **+** Nothing changes for a user who never touches it.
* **+** Little plumbing: the Skin already reaches the page, the Full screen view and both PDFs, so they all follow it with no new props.
* **+** The palette's type does not change, so its other readers are not touched.
* **−** The control and the value it sets live in different sections (Colors and the Skin); the outline's width stays in the Skin's Decorative lines.
* **−** A color equal to the page background becomes invisible with the outline off.
