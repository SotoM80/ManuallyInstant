# ADR 0020: One Apply button next to each image

## Status
Proposed — 2026-10-29

## Context
ADR 0007 made the forms live and let new images wait for **one Apply button at the top of the sections column**, which shows every waiting image of every section at once. In use, that button is far from the field where the image was chosen (the Logo section alone has up to 4 cards, 4 parts per card, 4 versions and a grid), and pressing it can show images the user did not mean to show yet.

Options considered:
* **Keep one Apply at the top**: what we have; the problem above.
* **One Apply per section**: closer, but in a long section it is still far from the field, and it still shows several images at once.
* **One Apply next to each image field**: right where the image was chosen, and it shows only that image.

## Decision
We will put an **Apply** button next to every image field that waits (the Cover logo; every card, part, version and the construction grid of Logo; every example of Usage), and remove the Apply button at the top. Each Apply shows **only its own image**. The rest of ADR 0007 stays: everything else is live, and a new image still waits.

One exception keeps a rule of `specs/logolayers.md`: the Apply of an Anatomy card also shows the images of the parts made from that card's layered SVG, even when it is pressed while the file is still being read.

How it works (`src/utils/pendingImage.ts`): each image remembers the file chosen and the file the manual shows (`{ file, shown }`); Apply copies one into the other. The shared Apply count and the "pending" reports to `BrandManualPage` are gone.

The Mockups photo upload stays as it is: it opens the template editor at once, whose Save is the confirmation.

## Consequences
* **+** The button is where the image is, and does exactly one thing.
* **+** Simpler state: no counter shared by every form, and `BrandManualPage` no longer tracks which forms have images waiting.
* **−** Several Apply buttons on screen. Each one has its own accessible name (`Apply Logo`, `Apply Version 1 image`…), and stays disabled until its field has a new valid image.
* **−** Choosing images in several fields takes several clicks to show them all.
* Amends ADR 0007 (where Apply sits and what it shows).
