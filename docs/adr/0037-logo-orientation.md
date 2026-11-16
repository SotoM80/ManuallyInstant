# ADR 0037: Horizontal or vertical logo on every mockup

## Status
Proposed — 2026-11-16

## Context
The logo sits on a mockup the way the logo image is: horizontal. On some products the user wants it vertical (along the side of a mug, up a t-shirt's sleeve, a photo shot sideways). Photo mockups have a **Rotation** slider (−45° to 45°), which tilts the logo but cannot turn it upright, and illustrations have no control at all.

Turning the logo 90° is not enough by itself: the logo is fitted to its area while horizontal, so a wide logo turned in a wide area sticks out above and below it. A larger Rotation range (±180°) was tried and dropped for that reason, and because the user wants a clear choice, not a free turn.

## Decision
Every mockup gets an **Orientation** select, **Horizontal** (default) or **Vertical**, kept per product in `MockupSettings.orientation`.

* **Vertical** turns the logo a quarter turn to the **left** (it reads from bottom to top, as on book spines in most of Europe and Latin America) and fits it in its area **turned**: the logo's width runs along the area's height. It is as large as the area allows, and never leaves it.
* **Photo mockups**: the turn is added to Rotation (still −45° to 45°, a tilt on top), and the fitting and the "keep it inside" check use the turned logo. Reset keeps the Orientation.
* **Illustrations**: the logo image is drawn in the product's logo box turned: its box is swapped (width ↔ height) around the same center, then turned −90° with the box's own `rotate`.
* One helper, in `geometry.ts`, gives the logo's size and turn for an orientation, so the illustration, the WebGL composer and the drag all agree.

## Consequences
* A setting saved before has no `orientation`: it reads as Horizontal, so nothing changes for existing mockups.
* The PDF needs nothing new: it copies the page's SVG and images as they are.
* The quarter turn is always to the left. If the user later wants the other way, it is a third option (`Vertical, right`), not a change of this one.
