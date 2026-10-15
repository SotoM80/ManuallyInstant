// Guides the user places on the construction grid (3.2) with a click, to measure parts of
// the logo. Each guide is a distance from the logo's left edge (vertical guides) or top edge
// (horizontal guides), in modules. The rulers then label every gap between the logo's edges
// and the guides in X, so the labels follow X while the guides stay on the same part of the logo.

export type Guides = { vertical: number[]; horizontal: number[] }

export const NO_GUIDES: Guides = { vertical: [], horizontal: [] }

// Guides land on half modules, so measures come out as tidy multiples of X
const SNAP = 0.5

export function snapGuide(position: number, length: number) {
  return Math.min(length, Math.max(0, Math.round(position / SNAP) * SNAP))
}

// Adds a guide, or removes it when there is already one there (a second click undoes it)
export function toggleGuide(guides: number[], position: number) {
  return guides.includes(position)
    ? guides.filter((guide) => guide !== position)
    : [...guides, position].sort((a, b) => a - b)
}

// The cuts of a ruler: the logo's two edges and every guide between them, from `start`
export function guideCuts(guides: number[], length: number, start: number) {
  const inside = guides.filter((guide) => guide > 0 && guide < length)
  return [0, ...inside, length].map((at) => start + at)
}

// The gap between two cuts in X: 1 → "X", 1.5 → "1.5X", 2.25 → "2.25X"
export function gapLabel(modules: number, x: number) {
  const value = Number((modules / x).toFixed(2))
  return value === 1 ? 'X' : `${value}X`
}
