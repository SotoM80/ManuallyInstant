import { normalizeHex } from '../data/colorPalette'
import type { PaletteColor } from '../types'

// The colors a skin draws with: the chosen palette colors, in order. With fewer than two
// (an empty palette, or one color ticked), the page background and the Typography color
// of the Cover fill in, so a skin always has two colors to work with.
export function skinColors(
  palette: PaletteColor[] | null,
  indices: number[],
  fallback: { background: string; ink: string },
) {
  const chosen = indices
    .map((index) => palette?.[index]?.hex)
    .filter((hex): hex is string => Boolean(hex && normalizeHex(hex)))
  const colors = [...chosen, fallback.ink, fallback.background]
  return colors.slice(0, Math.max(2, chosen.length))
}
