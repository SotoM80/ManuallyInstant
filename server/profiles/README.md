# ICC profiles

The CMYK server converts with one ICC profile, read from `CMYK_PROFILE_PATH` (ADR 0019). Profile files may not be shared freely, so **they are not kept in git** (`*.icc` and `*.icm` here are ignored). Put the file in this folder, or point `CMYK_PROFILE_PATH` to it. Without it, the server does not start.

## FOGRA39 (offset on coated paper, Europe)
Either file works; both describe the same printing conditions:

* **ISO Coated v2 (ECI)**: download *ECI_Offset_2008* from [eci.org](https://www.eci.org/en/downloads) and take `ISOcoated_v2_eci.icc` (the default `CMYK_PROFILE_PATH`).
* **Coated FOGRA39 (Adobe)**: installed with Adobe's apps on a Mac, at `/Library/Application Support/Adobe/Color/Profiles/Recommended/CoatedFOGRA39.icc`. Use that path in `CMYK_PROFILE_PATH`, and `CMYK_PROFILE_NAME=Coated FOGRA39`.

## Checking the values
The values match Illustrator within a point when Illustrator's Color Settings use the same profile, Relative Colorimetric, black point compensation and **sRGB** as the RGB working space (`specs/cmykserver.md`, Scenario 11). The *Europe Prepress 3* settings use Adobe RGB (1998), which gives other values for the same HEX.
