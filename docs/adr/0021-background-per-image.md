# ADR 0021: A background color for each logo image

## Status
Proposed — 2026-10-29

## Context
A brand manual often shows a version of the logo on its own color: a negative version on black, a symbol on the brand blue. Today every image box on the inner pages has no background of its own: it shows the page background, which belongs to the Skin (ADR 0011), the same for every page. A white logo is invisible on a white page, and there is no way to show a version on the color it is meant for.

Options considered:
* **One box color in the Skin**: simple, but every box gets the same color, which does not show a negative version next to a positive one.
* **A background per image, in the section where the image is chosen**: each version, card, part and Usage example can have its own color, or none.
* **Both**: a Skin default that each image may change. More to explain, for a need we do not have yet.

## Decision
We will give each image of the Anatomy cards and parts, the Logo versions and the Usage examples its own optional **Background** color, chosen in the same section as the image, in a folded **More** area under its image field. It is "No background" by default, which looks exactly as today. The color picker is the Skin's (`SkinColorField`, with palette chips that copy a color), with a "No background" option. The color is live: it never waits for Apply (ADR 0007), only images do (ADR 0020).

The Clear space page shows the Primary logo, so it uses the background of **Version 1**: the whole box of the construction grid (3.2), and the clear space area inside the dashed edge (3.1).

This refines ADR 0011: the page colors of the inner pages still belong to the Skin; the background of one image belongs to the section of that image. The Cover, Brand concept and Mockups get no image background: they have no box, or already have their own color (the Cover's Background, the product color of a mockup).

## Consequences
* **+** A version can be shown on the color it is made for, and a negative version next to the positive one.
* **+** With nothing chosen, every page looks as before.
* **−** Up to 36 more color fields in the forms (4 cards × 4 parts, 4 versions, 12 examples). Folding them under More keeps the forms short.
* **−** The faint outline and the stripes of an empty box are drawn in the page text color, so they show little on a dark background. Accepted for now.
* **−** The colors are not checked against the logo: a logo can be chosen on a background it does not show on.
