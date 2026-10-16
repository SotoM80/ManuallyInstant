import { direction } from './types'
import type { DrawSkin, GradientStop } from './types'

// The colors spread at even stops, the first at 0 and the last at 1
export function evenStops(colors: string[]): GradientStop[] {
  const last = Math.max(1, colors.length - 1)
  return colors.map((color, i) => ({ offset: i / last, color }))
}

// A linear gradient as CSS draws it: the angle points up at 0° and turns clockwise, and the
// line goes through the center, long enough for the first and last colors to reach the corners.
export const drawLinear: DrawSkin = (params, colors, page) => {
  const { dx, dy } = direction(params.angle ?? 0)
  const half = (Math.abs(page.width * dx) + Math.abs(page.height * dy)) / 2
  const cx = page.width / 2
  const cy = page.height / 2
  return {
    kind: 'linear',
    x1: cx - dx * half,
    y1: cy - dy * half,
    x2: cx + dx * half,
    y2: cy + dy * half,
    stops: evenStops(colors),
  }
}
