import { SECTION_PAGES } from '../data/manualSections'
import type { SectionBackground, SectionId, Skin } from './types'

// A background for each section of the manual, kept in the Skin (specs/sectionbackgrounds.md,
// ADR 0025). Pure functions: each one returns a new skin.

export const SECTION_IDS: readonly SectionId[] = ['cover', 'logo', 'usage', 'colors', 'typography', 'mockups']

export const OPACITY = { min: 5, max: 100, step: 5 }

// Nothing set: the Skin's Page background, no picture
export const NO_SECTION_BACKGROUND: SectionBackground = { color: null, image: null, fit: 'cover', opacity: 100 }

export function isSectionId(id: string): id is SectionId {
  return (SECTION_IDS as readonly string[]).includes(id)
}

// The section a page belongs to, from the pages each section features (the Skin's entry only
// points at its first painted page, so it is left out)
export function sectionOfPage(page: string): SectionId | null {
  return SECTION_IDS.find((id) => SECTION_PAGES[id]?.includes(page)) ?? null
}

export function sectionBackground(skin: Skin, id: SectionId): SectionBackground {
  return skin.sections?.[id] ?? NO_SECTION_BACKGROUND
}

// Changes some fields of one section's background; the others, and every other section, stay
export function setSectionBackground(skin: Skin, id: SectionId, change: Partial<SectionBackground>): Skin {
  return {
    ...skin,
    sections: { ...skin.sections, [id]: { ...sectionBackground(skin, id), ...change } },
  }
}

// The color a page is painted with: the Cover's own, or its section's, or the Skin's Page background
export function pageColor(skin: Skin, page: string, coverBackground: string | undefined) {
  if (page === 'Cover') return coverBackground
  const id = sectionOfPage(page)
  return (id && skin.sections?.[id]?.color) || skin.pageBackground
}

// The applied picture a page draws under the Skin's layers, if its section has one
export function pagePicture(skin: Skin, page: string) {
  const id = sectionOfPage(page)
  const background = id ? skin.sections?.[id] : undefined
  return background?.image ? { image: background.image, fit: background.fit, opacity: background.opacity } : null
}
