// Dimension lines of the construction grid (3.2), written as a sequence of multiples of X,
// e.g. "X 1.5X X 1.5X X". Each step is drawn `value × X` long, so the rulers follow X.

export const RULER_ERROR = 'Use steps like X, 1.5X or 2X, separated by spaces'

// One step: an optional number (1.5 or 1,5) followed by X, in any case
const STEP = /^(\d+(?:[.,]\d+)?)?x$/i

// "X 1.5X X" → [1, 1.5, 1]. An empty text is an empty ruler (nothing drawn);
// anything that is not a step gives null, so the form can flag it.
export function parseRuler(text: string): number[] | null {
  const steps = text.trim().split(/[\s·]+/).filter(Boolean) // a comma is a decimal mark
  const values: number[] = []
  for (const step of steps) {
    const match = STEP.exec(step)
    if (!match) return null
    const value = match[1] ? Number(match[1].replace(',', '.')) : 1
    if (!(value > 0)) return null
    values.push(value)
  }
  return values
}

// 1 → "X", 1.5 → "1.5X"
export function stepLabel(value: number) {
  return value === 1 ? 'X' : `${value}X`
}
