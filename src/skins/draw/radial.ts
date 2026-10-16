import { evenStops } from './linear'
import type { DrawSkin } from './types'

// A radial gradient: Color A at the center (a share of the page's width and height), Color B
// reached at the radius (a share of the page's diagonal) and filling the page past it.
export const drawRadial: DrawSkin = (params, colors, page) => ({
  kind: 'radial',
  cx: ((params.cx ?? 50) / 100) * page.width,
  cy: ((params.cy ?? 50) / 100) * page.height,
  r: ((params.radius ?? 100) / 100) * Math.hypot(page.width, page.height),
  stops: evenStops(colors),
})
