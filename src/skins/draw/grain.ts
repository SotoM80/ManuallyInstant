import type { DrawSkin } from './types'

// Same noise on every page and in the PDF
export const GRAIN_SEED = 7

// Fine specks over the whole page, some in Color A and some in Color B (two channels of the same
// noise), with nothing between them, so a Grain layer can sit over any other. At Grain size 1 a
// speck is about 1 mm; bigger sizes give bigger, rarer specks.
export const drawGrain: DrawSkin = (params, [a, b]) => {
  const frequency = 1.2 / (params.size ?? 1)
  return {
    kind: 'texture',
    frequency: [frequency, frequency],
    octaves: 2,
    seed: GRAIN_SEED,
    tints: [
      { color: a, channel: 'r', gain: 6, cut: 3.6 },
      { color: b, channel: 'g', gain: 6, cut: 3.6 },
    ],
  }
}
