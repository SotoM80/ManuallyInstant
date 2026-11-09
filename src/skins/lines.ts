import type { CSSProperties } from 'react'
import type { Skin, SkinControl, SkinLines } from './types'

// The weight of the manual's lines, kept in the Skin (specs/lines.md, ADR 0026)

// Today's lines: an untouched skin changes nothing
export const DEFAULT_LINES: SkinLines = { decorative: 1, technical: 100 }

// The two sliders of the Lines group: px for the decorative lines (all 1 px before), % for the
// technical ones (several widths, kept apart)
export const LINE_CONTROLS: (SkinControl & { key: keyof SkinLines })[] = [
  { key: 'decorative', label: 'Decorative lines', min: 0.5, max: 4, step: 0.5, unit: ' px' },
  { key: 'technical', label: 'Technical lines', min: 50, max: 300, step: 25, unit: '%' },
]

export function skinLines(skin: Skin): SkinLines {
  return skin.lines ?? DEFAULT_LINES
}

export function setLines(skin: Skin, change: Partial<SkinLines>): Skin {
  return { ...skin, lines: { ...skinLines(skin), ...change } }
}

// The CSS variables every page sets, the Cover included; the templates' CSS reads them
export function lineVariables(skin: Skin): CSSProperties {
  const { decorative, technical } = skinLines(skin)
  return { '--line-decorative': `${decorative}px`, '--line-technical': String(technical / 100) } as CSSProperties
}
