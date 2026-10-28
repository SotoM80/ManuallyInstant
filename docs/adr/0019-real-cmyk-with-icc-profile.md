# ADR 0019: Real CMYK with an ICC profile, one page per request

## Status
Proposed — 2026-10-28

## Context
With the server of ADR 0018, the print PDF can be in real CMYK and the Color palette page can show CMYK values that match it. Pages are already drawn as images (ADR 0012), so converting a page means converting the pixels of one image. The conversion depends on the printing conditions; the studio works with European print shops (offset on coated paper).

Options considered:
* **Ghostscript** (converts a whole PDF): AGPL, which brings obligations when it is offered as an online service.
* **sharp `toColourspace('cmyk')` with a CMYK JPEG**: in sharp it first converts with libvips' own CMYK profile and then again with ours, and if the profile cannot be used it only logs a warning and sends sRGB (sharp issue #1323).
* **sharp `withIccProfile(profile).raw()`** (libvips + Little CMS): one sRGB → CMYK conversion, 4 channels, 0 = no ink.
* **All pages in one request**: 10 pages at 300 dpi weigh 20–150 MB, too much for home uploads, proxies and PHP limits.

## Decision
We will convert with **sharp** (`flatten` on white, then `withIccProfile(profile)` and `.raw()`), and the server will refuse any result that does not have 4 channels. The profile is a file set by `CMYK_PROFILE_PATH`, **ISO Coated v2 (FOGRA39)** for now; ECI publishes no redistribution terms, so the file is not kept in git, and without it the server falls back to sharp's built-in `cmyk` profile and says it is generic. Palette colors go through the same conversion, so the page and its numbers agree.

The browser sends **one page per request** (the PNG drawn as today), the server answers with that page's CMYK pixels compressed with zlib, and the browser builds the PDF with **pdf-lib**, placing each page as a `DeviceCMYK` image with the bytes as they come (`FlateDecode`). pdf-lib is loaded only when a print PDF is made. The web PDF does not change.

## Consequences
* **+** One color conversion with the studio's own profile; the pages and the palette values always agree.
* **+** Lossless pages, as the PNGs are today.
* **+** Every request stays under ~15 MB, gives natural progress (`Converting to CMYK… 3/10`) and keeps the server stateless.
* **−** Black and gray text become a mix of the four inks ("rich black"), because pages are images. Small text may look soft if the press is slightly out of register. Vector text in K only would need a vector PDF (see ADR 0012), so it is left for later.
* **−** The rendering intent is always **Perceptual** (sharp fixes it). Brand guides often use Relative Colorimetric; for colors inside the gamut the difference is small.
* **−** The print PDF weighs about 1.3–2 times the RGB one.
* **−** Without an output intent in the PDF, viewers show DeviceCMYK with their own default profile, so the on-screen look can be a little off; the separations are right.
* **−** Before this ADR is accepted, a short spike must show that `withIccProfile` works with the FOGRA39 file and matches ColorSync within ±1.
* Supersedes ADR 0003 once accepted. The naive formula stays as the fallback when there is no server.
