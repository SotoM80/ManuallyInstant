# ADR 0039: A Solid logo is shaded by the folds only, not by the product's color

## Status
Accepted — 2026-11-23

## Context
On a photo mockup the logo is blended with the photo (ADR 0014): **Printed** multiplies it with the photo (dark logos), **Solid** lays it over the photo with the photo's shading on top (light logos). Solid shaded the logo by the photo's brightness compared with a lit white t-shirt (`WHITE_LEVEL`, 0.92): `logo × (0.4 + 0.6 × brightness / 0.92)`.

That works for a light photo tinted dark (a white t-shirt set to navy), whose brightness is that of the white shirt. It fails for a photo of a product that is dark itself (a black mug, a navy shirt photographed as it is): its whole surface reads as "in shadow", and a white logo comes out about 47 % gray. The formula could not tell "this product is dark" from "this part is in shadow".

## Decision
* Before drawing, the renderer measures the photo's **mean brightness under the logo**: the pixels of the box holding the logo's mesh, weighted by the photo's opacity and, when the template's mask covers any of them, by the mask (only the product counts). The mean never goes below 0.04, so the noise of a black photo is not read as deep folds. With nothing to weigh, it is 0.92, as before.
* Solid compares each point with that mean instead of 0.92: `logo × (0.4 + 0.6 × min(brightness / mean, 1))`. Where the product has its usual tone the logo keeps its own color (white stays white); it darkens only where the photo is darker than the product around it, in its folds and shadows.
* The measuring is a plain function (`src/mockups/render/shading.ts`), tested with Jest; the shader receives one more number (`uMean`).
* **Printed** and the product's tint do not change: the tint still uses 0.92, so a tinted product keeps its color.

Options considered:
* **A smaller shading share** (0.6 → 0.2): one constant, but the folds would almost vanish on every photo, light or dark.
* **A Shading slider** (0–100 %, the "Amount" noted for later in the spec): lets the user choose, but leaves the default wrong for dark photos and adds a control. It can still come later, on top of this.

## Consequences
* A white logo in Solid is white on any product, light or dark, tinted or not, and still follows its folds.
* On a light photo tinted dark the result barely changes: the mean is close to 0.92.
* A logo laid over very different tones (half on a black shirt, half on a white wall, with no product selected) is shaded against their mean; selecting the product in Edit template makes only the product count.
* The PDF needs nothing new: it copies the composed image.
