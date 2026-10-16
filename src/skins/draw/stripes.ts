import type { DrawSkin } from './types'

// Parallel stripes `thickness` mm wide, one every `scale` mm, alternating Color A and Color B.
// At 0° they run up the page (like the angle of a CSS gradient); `angle` turns them.
export const drawStripes: DrawSkin = (params, [a, b]) => {
  const spacing = params.scale ?? 12
  const thickness = Math.min(params.thickness ?? 4, spacing)
  return {
    kind: 'pattern',
    width: spacing * 2,
    height: spacing * 2,
    angle: params.angle ?? 0,
    marks: [
      { type: 'rect', x: 0, y: 0, width: thickness, height: spacing * 2, color: a },
      { type: 'rect', x: spacing, y: 0, width: thickness, height: spacing * 2, color: b },
    ],
  }
}
