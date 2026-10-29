# ADR 0023: An Image layer in the Skin

## Status
Accepted — 2026-10-29

## Context
Brands often have a picture of their own for the background of a manual: a photo, a paper scan, a texture from the brand's world. The Skin only has drawn layers (gradients, shapes, patterns, textures), and `specs/skins.md` left "uploading your own images" out of scope.

Two earlier decisions do not fit a picture:
* ADR 0009: every preset is a pure function `(params, colors, page) → shapes`. A picture is a file, not something drawn from numbers and colors.
* ADR 0010: every layer has a preset, its numeric values, **two colors** and a `visible` flag. A picture has no colors, and how it fills the page (cropped or whole) is a choice, not a number.

Options considered:
* **A fixed background picture under every layer**: simple, but it cannot be stacked, faded, reordered or shown on the Cover like a layer.
* **A new layer kind, Image**: it gets the stack for free (on/off, order, Intensity, Also on the Cover, the 4-layer limit), with a few exceptions to ADRs 0009 and 0010.

## Decision
We will add an **Image** layer kind, in its own **Images** group of the gallery. An Image layer:
* has **no colors**: its `colors` are kept in the type, as for any layer, and ignored;
* holds its **applied image** (`image: UploadedImage | null`) and its **Fit** (`fit: 'cover' | 'contain'`), outside the numeric `params`, which keep only **Intensity**;
* is drawn by `SkinBackdrop` as an SVG `<image>` the size of the page in mm (`preserveAspectRatio` `xMidYMid slice` for Cover, `meet` for Contain), inside the layer's group and its opacity, like any layer (ADR 0009 otherwise holds). It has no draw function; with no applied image it draws nothing;
* chooses its picture with an image field whose new file waits for its own **Apply** (ADR 0020). The file waiting for Apply lives in the Skin form; only the applied image is in the skin.

The PDF draws the page as an image (ADR 0012); html-to-image turns the SVG `<image>` into a data URL like an `<img>`, but leaves it **blank, with no error**, when the file cannot be read. So before drawing, the export waits for every Skin image to load and checks that it can be read, and stops with the usual failure message if not.

This amends ADR 0009 (not every layer is a pure drawing) and ADR 0010 (not every layer has two colors and only numeric values).

## Consequences
* **+** A picture behind the pages, with everything a layer already has: on/off, order, Intensity, Also on the Cover, at most 4 layers.
* **+** Drawn in the same SVG as the other layers, so it blends with them and sits under the content.
* **−** One layer kind with its own fields and form controls, and a few `if image` branches in the form and the drawing.
* **−** A photo over the whole page makes the print PDF much heavier: each page is a 300 dpi PNG of about 15–25 MB. With a CMYK server, a page over its limit (40 MB) is refused and the export shows its usual failure.
* **−** The picture is not edited in the app: no moving, zooming or cropping beyond Cover / Contain.
