import { readFile } from 'node:fs/promises'
import {
  instantiate,
  cmsFLAGS_BLACKPOINTCOMPENSATION,
  cmsInfoDescription,
  INTENT_RELATIVE_COLORIMETRIC,
  TYPE_CMYK_8,
  TYPE_RGB_8,
} from 'lcms-wasm'

export type ProfileSettings = { path: string; id: string; name: string; blackPointCompensation: boolean }

// The one sRGB → CMYK transform every request uses (specs/cmykserver.md, ADR 0019)
export type Profile = {
  id: string
  name: string
  description: string // as written in the file, e.g. "Coated FOGRA39 (ISO 12647-2:2004)"
  blackPointCompensation: boolean
  toCmyk(rgb: Uint8Array, pixels: number): Uint8Array // 3 bytes per pixel in, 4 out, 0 = no ink
}

// Why the server cannot start with this profile
export class ProfileError extends Error {}

// The header says what a profile is for: bytes 12–15 its class, 16–19 its color space
function header(icc: Uint8Array, from: number) {
  return String.fromCharCode(...icc.subarray(from, from + 4))
}

// Reads the profile file and builds the transform. A print PDF must never use a profile nobody
// chose, so there is no fallback: a missing or wrong file stops the server.
export async function loadProfile(settings: ProfileSettings): Promise<Profile> {
  let icc: Uint8Array
  try {
    icc = new Uint8Array(await readFile(settings.path))
  } catch {
    throw new ProfileError(`No ICC profile at ${settings.path} (see server/profiles/README.md)`)
  }
  if (icc.byteLength < 128 || header(icc, 12) !== 'prtr' || header(icc, 16) !== 'CMYK') {
    throw new ProfileError(`${settings.path} is not a CMYK output profile`)
  }

  const lcms = await instantiate()
  const output = lcms.cmsOpenProfileFromMem(icc, icc.byteLength)
  if (!output) throw new ProfileError(`${settings.path} could not be read as an ICC profile`)
  const flags = settings.blackPointCompensation ? cmsFLAGS_BLACKPOINTCOMPENSATION : 0
  const transform = lcms.cmsCreateTransform(
    lcms.cmsCreate_sRGBProfile(),
    TYPE_RGB_8,
    output,
    TYPE_CMYK_8,
    INTENT_RELATIVE_COLORIMETRIC,
    flags,
  )
  if (!transform) throw new ProfileError(`${settings.path} cannot convert from sRGB`)

  return {
    id: settings.id,
    name: settings.name,
    description: lcms.cmsGetProfileInfoASCII(output, cmsInfoDescription, 'en', 'US'),
    blackPointCompensation: settings.blackPointCompensation,
    toCmyk: (rgb, pixels) => lcms.cmsDoTransform(transform, rgb, pixels),
  }
}
