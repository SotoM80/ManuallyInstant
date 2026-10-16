# ADR 0010: Skins as a stack of layers, reordered with buttons

## Status
Accepted — 2026-10-16

## Context
The first version of skins (ADR 0009, `specs/skins.md`) let the user pick **one** preset. Designers want to combine them: a gradient under a pattern, a shape over both. That needs several layers at once, a way to turn each one on or off, and a way to decide which one sits on top.

Options considered for **combining**:
* **One preset with extra options** (e.g. "gradient + dots"). Every combination would need its own code.
* **A stack of independent layers**, each one a preset with its own values, colors and Intensity. The drawings already are pure functions of one preset, so a stack only changes who calls them.

Options considered for **ordering**:
* **Drag and drop** with a library (dnd-kit, react-beautiful-dnd): direct, but a new dependency, against ADR 0006.
* **Native HTML drag and drop**: no dependency, but it does not work with the keyboard, works badly on touch screens, and jsdom cannot test it.
* **Move up / Move down buttons**: work with the keyboard and screen readers, are tested like any button, and need no library. The rows glide with `useReorderGlide`, which already moves the pages and the sections.

Options considered for **blending**:
* **Blend modes** (`mix-blend-mode`: Multiply, Screen, Overlay). Richer, but PDF tools often ignore or flatten them, so the PDF could look different from the preview.
* **Transparency only**: each layer's Intensity is its opacity. Every PDF tool supports it.

## Decision
We will model a skin as an ordered list of up to **4 layers** (`{ layers: SkinLayer[] }`), where the first layer of the list is drawn on top, as in the layers panel of a design tool. Each layer has a stable id, a preset, its values, its two colors and a `visible` flag. Layers are reordered with **Move up / Move down** buttons and blend by **transparency only**. Each page draws all visible layers in **one** SVG, one group per layer, with ids made of the SVG's `useId` and the layer's id.

## Consequences
* **+** The drawing functions of ADR 0009 are reused unchanged.
* **+** The list operations (add, remove, move, show/hide) are pure functions, unit tested without React.
* **+** Reordering is accessible and testable, with no new dependency.
* **+** What the preview shows is what any PDF tool can draw.
* **−** Moving a layer from the bottom to the top of 4 takes three clicks. Drag and drop can be added later on top of the buttons.
* **−** No blend modes: some effects designers know from Photoshop are not possible.
* **−** Up to 4 layers × 7 pages, plus mini previews and the gallery, is a few dozen SVG groups; the limit keeps it light, and Textures (`feTurbulence`) stay out until the PDF library is chosen.
* **−** The one-preset model of the first version is replaced: `Skin`, `SkinForm` and their tests change.
