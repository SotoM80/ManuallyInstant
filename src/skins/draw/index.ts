import type { Skin } from '../types'
import { drawLinear } from './linear'
import { drawRadial } from './radial'
import { drawDots } from './dots'
import { drawStripes } from './stripes'
import type { DrawSkin, Page } from './types'

// The drawing of each preset. Only presets listed here are shown in the gallery,
// so a preset that is not built yet never appears (see specs/skins.md).
export const SKIN_DRAWINGS: Record<string, DrawSkin> = {
  linear: drawLinear,
  radial: drawRadial,
  dots: drawDots,
  stripes: drawStripes,
}

// What to draw for a skin, or null for None (and for an id with no drawing)
export function drawSkin(skin: Skin, colors: string[], page: Page) {
  const draw = SKIN_DRAWINGS[skin.preset]
  return draw ? draw(skin.params, colors, page) : null
}
