import { normalizeHex } from '../data/colorPalette'
import type { PaletteColor } from '../types'
import type { Skin } from './types'

// The two colors a skin draws with, as HEX (see specs/skins.md, Colors):
// a chosen palette color → that color; Auto (or a color that was removed) → palette color 1
// for Color A and 2 for Color B; with no such color → the Typography color for A and the
// Background color for B. So a skin always has two colors to work with.
export function skinColors(
  palette: PaletteColor[] | null,
  [a, b]: Skin['colors'],
  fallback: { background: string; ink: string },
): [string, string] {
  const colors = (palette ?? []).filter((color) => normalizeHex(color.hex))
  const pick = (id: number | null, auto: number, otherwise: string) =>
    colors.find((color) => color.id === id)?.hex ?? colors[auto]?.hex ?? otherwise
  return [pick(a, 0, fallback.ink), pick(b, 1, fallback.background)]
}
