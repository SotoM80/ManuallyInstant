# ADR 0038: Clip the logo to the product on photo mockups

## Status
Accepted — 2026-11-17

## Context
Since ADR 0037 the logo on a photo mockup keeps its size when turned Vertical and can be moved anywhere on the photo, inside a Padding. A logo larger than the product (a long logo turned, a large Size) is then drawn past the product's edge, over the table or the wall behind it, like a sticker on the photo. A logo printed on a card or a t-shirt never does that.

The renderer already has the product's shape: the template's mask (white where the product is), used to tint it. The template editor saves a mask image for every template, even when nothing was selected (an untinted uploaded photo, ADR 0036); that mask is all black.

## Decision
* A **Clip to product** checkbox in a photo mockup's block, **on by default**, kept per product (`MockupSettings.clip`, none saved → on).
* When on, the logo's shader multiplies the logo's alpha by the mask (`texture2D(uMask, vUV)`), so the logo is drawn only on the product, with the mask's soft edge. The photo is never changed.
* A template "knows its product" when it has mask polygons or a mask image. The template editor saves **no mask image** when nothing is selected, so an untinted photo with no selection has no shape. For such a photo the checkbox is disabled, with a hint to select the product in Edit template.
* Clipping is drawn, not placed: the Padding and the drag (ADR 0037) do not change, and the part of the logo past the product is simply not drawn.

## Consequences
* A photo with more than one product (the bundled business card shows two cards) clips to all of them: a very large logo may show a sliver on the second card.
* Templates saved before this change with an empty selection still have an all-black mask image; they are made again only when edited. Until then, Clip to product hides their logo; such templates live only in the session, so this ends on reload.
* The PDF needs nothing new: it copies the composed image.
