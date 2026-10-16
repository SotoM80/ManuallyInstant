import { normalizeHex } from '../data/colorPalette'
import type { PaletteColor } from '../types'
import type { SkinLayer } from './types'

// The two colors a skin draws with, as HEX (see specs/skins.md, Colors):
// a chosen palette color → that color; Auto (or a color that was removed) → palette color 1
// for Color A and 2 for Color B; with no such color → the Typography color for A and the
// Background color for B. So a skin always has two colors to work with.
// Palette colors a skin can use: those with a valid HEX
function usable(palette: PaletteColor[] | null) {
  return (palette ?? []).filter((color) => normalizeHex(color.hex))
}

// The name of the color Auto uses for Color A (0) or Color B (1), shown in its select
export function autoColorName(palette: PaletteColor[] | null, index: 0 | 1) {
  const color = usable(palette)[index]
  if (!color) return index === 0 ? 'Typography color' : 'Background color'
  return color.name || `Color ${(palette ?? []).indexOf(color) + 1}`
}

export function skinColors(
  palette: PaletteColor[] | null,
  [a, b]: SkinLayer['colors'],
  fallback: { background: string; ink: string },
): [string, string] {
  const colors = usable(palette)
  const pick = (id: number | null, auto: number, otherwise: string) =>
    colors.find((color) => color.id === id)?.hex ?? colors[auto]?.hex ?? otherwise
  return [pick(a, 0, fallback.ink), pick(b, 1, fallback.background)]
}
