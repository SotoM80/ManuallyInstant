import type { DrawSkin } from './types'

export const PAPER_SEED = 11

// A sheet of paper: Color B over the whole page, with soft fibers of Color A. The noise is
// stretched (eight times slower across than down), so the fibers are long and run across the
// page; bigger Fiber sizes give longer, wider fibers.
export const drawPaper: DrawSkin = (params, [a, b]) => {
  const size = params.size ?? 2
  return {
    kind: 'texture',
    frequency: [0.15 / size, 1.2 / size],
    octaves: 3,
    seed: PAPER_SEED,
    base: b,
    tints: [{ color: a, channel: 'r', gain: 3, cut: 1.5 }],
  }
}
