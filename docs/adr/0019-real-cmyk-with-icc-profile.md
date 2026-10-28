# ADR 0019: Real CMYK with an ICC profile, one page per request

## Status
Accepted — 2026-10-28

## Context
With the server of ADR 0018, the print PDF can be in real CMYK and the Color palette page can show CMYK values that match it. Pages are already drawn as images (ADR 0012), so converting a page means converting the pixels of one image. The conversion depends on the printing conditions; the studio works with European print shops (offset on coated paper).

Options considered:
* **Ghostscript** (converts a whole PDF): AGPL, which brings obligations when it is offered as an online service.
* **sharp `toColourspace('cmyk')` with a CMYK JPEG**: in sharp it first converts with libvips' own CMYK profile and then again with ours, and if the profile cannot be used it only logs a warning and sends sRGB (sharp issue #1323).
* **sharp `withIccProfile(profile).raw()`** (libvips + Little CMS): one sRGB → CMYK conversion, 4 channels, 0 = no ink, but sharp fixes the rendering intent to **Perceptual**. A spike with Coated FOGRA39 showed that Perceptual moves saturated colors far from what Illustrator and Photoshop give (Relative Colorimetric by default): `#00A86B` is `79, 9, 74, 0` in Perceptual and `80, 1, 75, 0` in Relative; `#E53935` is `9, 88, 79, 1` and `1, 91, 85, 0`.
* **Little CMS compiled to WebAssembly (`lcms-wasm`, MIT)**: the whole lcms API, so any intent and black point compensation. The spike converted an A4 page at 300 dpi in 0.4 s, and matched ColorSync's Relative Colorimetric within 1 point (3 in dark grays).
* **All pages in one request**: 10 pages at 300 dpi weigh 20–150 MB, too much for home uploads, proxies and PHP limits.

## Decision
We will decode each page with **sharp** (and `flatten` it on white), and convert it with **lcms-wasm**, from sRGB to the profile, with **Relative Colorimetric and black point compensation**, the defaults of Adobe's apps. Black point compensation can be turned off with `CMYK_BLACK_POINT_COMPENSATION=false`. The server refuses any result that does not have 4 channels. The profile is a file set by `CMYK_PROFILE_PATH`, **FOGRA39** for now (ECI's ISO Coated v2 or Adobe's Coated FOGRA39). Neither file may be shared freely, so it is not kept in git; the server does not start without it. Palette colors go through the same transform, so the page and its numbers agree.

The browser sends **one page per request** (the PNG drawn as today), the server answers with that page's CMYK pixels compressed with zlib, and the browser builds the PDF with **pdf-lib**, placing each page as a `DeviceCMYK` image with the bytes as they come (`FlateDecode`). pdf-lib is loaded only when a print PDF is made. The web PDF does not change.

## Consequences
* **+** One color conversion with the studio's own profile; the pages and the palette values always agree.
* **+** Lossless pages, as the PNGs are today, in about 1.7 s per page.
* **+** Every request stays under ~15 MB, gives natural progress (`Converting to CMYK… 3/10`) and keeps the server stateless.
* **−** Black and gray text become a mix of the four inks ("rich black"), because pages are images. Small text may look soft if the press is slightly out of register. Vector text in K only would need a vector PDF (see ADR 0012), so it is left for later.
* **+** The values follow the same rules as Illustrator and Photoshop, though not the same engine: Adobe uses its own (ACE), so a value can differ by a point or two. The studio should check a few colors against Illustrator once.
* **−** Two libraries for one job: sharp reads the PNG, lcms-wasm converts it. lcms-wasm is a small project with one author; if it stops being kept up, the same calls work with a native lcms binding.
* **−** The WebAssembly memory grows to the size of the largest page and is not given back (about 340 MB for a server converting A4 pages at 300 dpi).
* **−** Compressing the CMYK page takes longer than converting it (about 1.1 s of the 1.7 s a page takes).
* **−** The print PDF weighs about as much as the RGB one, or up to twice as much.
* **−** Without an output intent in the PDF, viewers show DeviceCMYK with their own default profile, so the on-screen look can be a little off; the separations are right.
* Checked against Illustrator on 2026-10-28 (Coated FOGRA39, Relative Colorimetric, black point compensation, sRGB): every value within 1 point (`specs/cmykserver.md`, Scenario 11).
* Supersedes ADR 0003. The naive formula stays as the fallback when there is no server.
