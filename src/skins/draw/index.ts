import type { SkinLayer } from '../types'
import { drawLinear } from './linear'
import { drawRadial } from './radial'
import { drawDots } from './dots'
import { drawStripes } from './stripes'
import { drawCircles } from './circles'
import { drawDiagonal } from './diagonal'
import { drawWaves } from './waves'
import { drawGrain } from './grain'
import { drawPaper } from './paper'
import type { DrawSkin, Page } from './types'

// The drawing of each preset. Only presets listed here are shown in the gallery,
// so a preset that is not built yet never appears (see specs/skins.md).
export const SKIN_DRAWINGS: Record<string, DrawSkin> = {
  linear: drawLinear,
  radial: drawRadial,
  circles: drawCircles,
  diagonal: drawDiagonal,
  waves: drawWaves,
  dots: drawDots,
  stripes: drawStripes,
  grain: drawGrain,
  paper: drawPaper,
}

// What to draw for a layer, or null for a preset with no drawing
export function drawLayer(layer: Pick<SkinLayer, 'preset' | 'params'>, colors: string[], page: Page) {
  const draw = SKIN_DRAWINGS[layer.preset]
  return draw ? draw(layer.params, colors, page) : null
}
