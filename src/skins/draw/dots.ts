import type { DrawSkin } from './types'

// Round dots in a square grid, `scale` mm apart, each a third of it wide. The tile holds two
// rows, so the rows alternate Color A and Color B. The grid is turned by `angle`.
export const drawDots: DrawSkin = (params, [a, b]) => {
  const scale = params.scale ?? 10
  const r = scale / 6
  return {
    kind: 'pattern',
    width: scale,
    height: scale * 2,
    angle: params.angle ?? 0,
    marks: [
      { type: 'circle', cx: scale / 2, cy: scale / 2, r, color: a },
      { type: 'circle', cx: scale / 2, cy: (scale * 3) / 2, r, color: b },
    ],
  }
}
