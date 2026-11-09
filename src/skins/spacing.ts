import type { CSSProperties } from 'react'
import { sectionOfPage } from './sections'
import type { SectionId, SectionSpacing, Skin, SkinControl } from './types'

// The line spacing of each section, kept in the Skin (specs/linespacing.md, ADR 0026).
// Pure functions: each one returns a new skin.

// Today's line heights: an untouched section changes nothing
export const DEFAULT_SPACING: SectionSpacing = { title: 100, text: 100 }

// The two sliders of the Line spacing group
export const SPACING_CONTROLS: (SkinControl & { key: keyof SectionSpacing })[] = [
  { key: 'title', label: 'Titles', min: 50, max: 200, step: 5, unit: '%' },
  { key: 'text', label: 'Text', min: 50, max: 200, step: 5, unit: '%' },
]

export function sectionSpacing(skin: Skin, id: SectionId): SectionSpacing {
  return skin.spacing?.[id] ?? DEFAULT_SPACING
}

// Changes one or both values of one section; every other section stays
export function setSectionSpacing(skin: Skin, id: SectionId, change: Partial<SectionSpacing>): Skin {
  return { ...skin, spacing: { ...skin.spacing, [id]: { ...sectionSpacing(skin, id), ...change } } }
}

// The CSS variables a page sets for its section, as factors (120 % → 1.2); the templates' CSS
// multiplies today's line heights by them
export function spacingVariables(skin: Skin, page: string): CSSProperties {
  const id = sectionOfPage(page)
  const { title, text } = id ? sectionSpacing(skin, id) : DEFAULT_SPACING
  return { '--title-leading': String(title / 100), '--text-leading': String(text / 100) } as CSSProperties
}
