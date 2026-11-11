import { MANUAL_PAGES } from '../data/manualSections'
import type { Skin, SkinFooter } from './types'

// The footer of the inner pages, kept in the Skin (specs/footer.md, ADR 0031)

// Not shown: an untouched skin changes nothing. Page numbers start on, so showing the footer
// for the first time always changes the pages.
export const DEFAULT_FOOTER: SkinFooter = { shown: false, numbers: true, text: '' }

export const FOOTER_TEXT_MAX = 80

export function skinFooter(skin: Skin): SkinFooter {
  return skin.footer ?? DEFAULT_FOOTER
}

export function setFooter(skin: Skin, change: Partial<SkinFooter>): Skin {
  const footer = { ...skinFooter(skin), ...change }
  return { ...skin, footer: { ...footer, text: footer.text.slice(0, FOOTER_TEXT_MAX) } }
}

// A page's number: its place in the manual's natural order, the Cover being 1 (never the
// preview's order, which brings an open section's pages to the top)
export function pageNumber(page: string): number {
  return MANUAL_PAGES.indexOf(page) + 1
}

// What one page's footer shows, or null when it has none (the Cover never has one)
export function pageFooter(skin: Skin, page: string): { number: number | null; text: string } | null {
  const { shown, numbers, text } = skinFooter(skin)
  if (!shown || page === 'Cover') return null
  const number = numbers && pageNumber(page) > 0 ? pageNumber(page) : null
  const trimmed = text.trim()
  if (number === null && !trimmed) return null
  return { number, text: trimmed }
}
