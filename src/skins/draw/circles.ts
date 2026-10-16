import { direction } from './types'
import type { DrawSkin, Mark } from './types'

// Each circle is this share of the one before it
export const CIRCLE_SHRINK = 0.7

// Circles in a line: the first one at the page's center, `size` % of its shorter side wide, and
// each next one smaller and touching the one before, towards `angle` (so the last ones may leave
// the page). They alternate Color A and Color B; between them, what is under the layer shows.
export const drawCircles: DrawSkin = (params, [a, b], page) => {
  const count = Math.max(1, Math.round(params.count ?? 3))
  const { dx, dy } = direction(params.angle ?? 0)
  let r = (((params.size ?? 45) / 100) * Math.min(page.width, page.height)) / 2
  let cx = page.width / 2
  let cy = page.height / 2
  const marks: Mark[] = []
  for (let i = 0; i < count; i++) {
    marks.push({ type: 'circle', cx, cy, r, color: i % 2 === 0 ? a : b })
    const next = r * CIRCLE_SHRINK
    cx += dx * (r + next)
    cy += dy * (r + next)
    r = next
  }
  return { kind: 'shapes', angle: 0, marks }
}
