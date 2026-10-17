import type { Placement, PhotoTemplate } from './types'

// The geometry of a photo mockup, in the photo's pixels (see specs/mockups.md, ADR 0014): fitting
// the logo and keeping it inside its area. The shape of the area is in warp.ts.

type Area = PhotoTemplate['area']

export const SIZE_LIMITS = { min: 0.2, max: 1.5 }
export const ROTATION_LIMIT = 45

// The logo fitted in its area, keeping its proportions, at `scale` (1 → it touches the area's sides)
export function fitLogo(area: Area, aspect: number, scale: number) {
  const wide = aspect >= area.width / area.height
  const width = (wide ? area.width : area.height * aspect) * scale
  return { width, height: width / aspect }
}

// The same placement, moved and resized only as far as the logo stays inside its area
// (the box around the turned logo must fit)
export function clampPlacement(area: Area, aspect: number, placement: Placement): Placement {
  const scale = Math.min(SIZE_LIMITS.max, Math.max(SIZE_LIMITS.min, placement.scale))
  const rotate = Math.min(ROTATION_LIMIT, Math.max(-ROTATION_LIMIT, placement.rotate))
  const { width, height } = fitLogo(area, aspect, scale)
  const turn = (rotate * Math.PI) / 180
  const boxWidth = Math.abs(width * Math.cos(turn)) + Math.abs(height * Math.sin(turn))
  const boxHeight = Math.abs(width * Math.sin(turn)) + Math.abs(height * Math.cos(turn))
  const maxX = Math.max(0, (area.width - boxWidth) / 2 / area.width)
  const maxY = Math.max(0, (area.height - boxHeight) / 2 / area.height)
  const clamp = (value: number, max: number) => Math.min(max, Math.max(-max, value))
  return { x: clamp(placement.x, maxX), y: clamp(placement.y, maxY), scale, rotate }
}

// A drag on the preview, in screen pixels, as a change of placement: the preview shows the whole
// photo `shownWidth` pixels wide, and the logo moves on a surface `surface` photo pixels big
export function dragPlacement(
  start: Placement,
  dx: number,
  dy: number,
  shownWidth: number,
  photoWidth: number,
  surface: { width: number; height: number },
) {
  const pixels = photoWidth / shownWidth
  return { ...start, x: start.x + (dx * pixels) / surface.width, y: start.y + (dy * pixels) / surface.height }
}
