# ADR 0037: Horizontal or vertical logo on every mockup

## Status
Accepted — 2026-11-17

## Context
The logo sits on a mockup the way the logo image is: horizontal. On some products the user wants it vertical (along the side of a mug, up a t-shirt's sleeve, a photo shot sideways). Photo mockups have a **Rotation** slider (−45° to 45°), which tilts the logo but cannot turn it upright, and illustrations have no control at all.

A larger Rotation range (±180°) was tried and dropped: the user wants a clear choice, not a free turn.

## Decision
Every mockup gets an **Orientation** select, **Horizontal** (default) or **Vertical**, kept per product in `MockupSettings.orientation`.

* **Vertical** turns the logo a quarter turn to the **left** (it reads from bottom to top, as on book spines in most of Europe and Latin America), **at the size it has horizontal**. A long logo then reaches past a wide area; the user sets it with **Size**, which illustrations now have too (20–150 %, around the center of the logo box).
* **Photo mockups**: the turn is added to Rotation (still −45° to 45°, a tilt on top), and the fitting and the "keep it inside" check use the turned logo. Reset keeps the Orientation.
* **Illustrations**: the logo image is drawn in the product's logo box, resized by Size around its center, and turned −90° with the box's own `rotate`.

Amended after trying it: at first Vertical fitted the logo again in its area turned, so in a wide area it became much smaller. The user wants it to keep its size and to be able to make it larger.

Amended again: kept at its size, a vertical logo in a thin area reached past the photo's top, and could not be moved (it was held inside its area, and larger than it). On photo mockups the logo is now held inside the **photo**, a **Padding** in from its edges (0–20 %, default 5 %), not inside its area: it can be dragged anywhere on the photo, and if it cannot fit within the Padding it is drawn just small enough to. One function, `clampInPhoto` (warp.ts), does it on the logo's outline, for the drag, the preview and the WebGL composer. Past its area, the logo follows the area's surface carried on straight (`curve` goes on past its ends).
* One helper, in `geometry.ts`, gives the logo's size and turn for an orientation, so the illustration, the WebGL composer and the drag all agree.

## Consequences
* A setting saved before has no `orientation`: it reads as Horizontal, so nothing changes for existing mockups.
* The PDF needs nothing new: it copies the page's SVG and images as they are.
* The quarter turn is always to the left. If the user later wants the other way, it is a third option (`Vertical, right`), not a change of this one.
