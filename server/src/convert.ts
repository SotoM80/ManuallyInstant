import sharp from 'sharp'
import { promisify } from 'node:util'
import { deflate } from 'node:zlib'
import type { Profile } from './profile.ts'

// Pixels of client brand assets must not stay in libvips' cache between requests (specs/cmykserver.md)
sharp.cache(false)

// Off the main thread: compressing a page takes longer than converting it (ADR 0019)
const deflateAsync = promisify(deflate)

export type Cmyk = { c: number; m: number; y: number; k: number }

// A request the server refuses because of what it sent, with its error code (specs/cmykserver.md)
export class BadInput extends Error {
  readonly code: 'not_an_image' | 'too_many_pixels'
  constructor(code: BadInput['code']) {
    super(code)
    this.code = code
  }
}

// One page: sharp only decodes the PNG and puts it on white paper, then lcms converts its pixels
// with the profile's transform. The answer is what a PDF calls FlateDecode (specs/cmykserver.md).
export async function pageToCmyk(png: Buffer, profile: Profile, maxPixels: number) {
  let info
  try {
    info = await sharp(png, { limitInputPixels: false }).metadata()
  } catch {
    throw new BadInput('not_an_image')
  }
  if (info.format !== 'png') throw new BadInput('not_an_image')
  if (info.width * info.height > maxPixels) throw new BadInput('too_many_pixels')

  const { data, info: raw } = await sharp(png, { limitInputPixels: maxPixels })
    .flatten({ background: '#ffffff' }) // paper has no transparency
    .removeAlpha()
    .toColourspace('srgb')
    .raw()
    .toBuffer({ resolveWithObject: true })
  const pixels = raw.width * raw.height
  const cmyk = profile.toCmyk(data, pixels)
  // Never send anything but 4 channels as CMYK
  if (raw.channels !== 3 || cmyk.length !== pixels * 4) throw new Error('The page did not convert to CMYK')
  return { width: raw.width, height: raw.height, deflated: await deflateAsync(cmyk, { level: 6 }) }
}

// The same transform for palette colors, so a page and its numbers agree (specs/colorpalette.md)
export function colorsToCmyk(hexes: string[], profile: Profile): Cmyk[] {
  const rgb = Uint8Array.from(hexes.flatMap((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))))
  const cmyk = profile.toCmyk(rgb, hexes.length)
  const percent = (value: number) => Math.round((value / 255) * 100)
  return hexes.map((_, i) => ({
    c: percent(cmyk[i * 4]),
    m: percent(cmyk[i * 4 + 1]),
    y: percent(cmyk[i * 4 + 2]),
    k: percent(cmyk[i * 4 + 3]),
  }))
}
