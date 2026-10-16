import { normalizeHex } from '../data/colorPalette'
import type { PaletteColor } from '../types'
import type { Skin, SkinLayer } from './types'

// The colors a new layer starts with, copied (see specs/skins.md and ADR 0011): palette colors
// 1 and 2, or the Page text color for A and the Page background for B when one is missing.
export function newLayerColors(palette: PaletteColor[] | null, skin: Skin): SkinLayer['colors'] {
  const colors = (palette ?? []).map((color) => normalizeHex(color.hex)).filter((hex): hex is string => Boolean(hex))
  return [colors[0] ?? skin.pageText, colors[1] ?? skin.pageBackground]
}
