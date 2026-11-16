export type ManualSection = {
  id: string
  label: string
  ready: boolean // false → shown disabled as "Coming soon"
}

// Sections of the Brand Manual page (right column), in order.
// When a section is built: set `ready: true` and plug its form in BrandManualPage.
export const MANUAL_SECTIONS: ManualSection[] = [
  { id: 'cover', label: 'Cover', ready: true },
  { id: 'logo', label: 'Logo', ready: true },
  { id: 'usage', label: 'Usage', ready: true },
  { id: 'colors', label: 'Colors', ready: true },
  { id: 'typography', label: 'Typography', ready: true },
  { id: 'skin', label: 'Skin', ready: true },
  { id: 'mockups', label: 'Mockups', ready: true },
]

// Parts of the Logo section being built one at a time. A part that is off shows
// "Coming soon" in the form and on its page, and sends nothing to the preview.
// When a part is built: set it to true (its form and page are already plugged in).
export type LogoParts = {
  versions: boolean // Versions group → Logo versions page
  clearSpace: boolean // Clear space & size group → Clear space page
}

export const LOGO_PARTS: LogoParts = {
  versions: true,
  clearSpace: true,
}

// Pages of the manual shown in the preview (left column), in order.
// The Logo section fills four pages: Brand concept, Anatomy, Logo versions and Clear space;
// the Usage section two: Correct use and Incorrect use.
export const MANUAL_PAGES = [
  'Cover',
  'Brand concept',
  'Anatomy',
  'Logo versions',
  'Clear space',
  'Correct use',
  'Incorrect use',
  'Color palette',
  'Typography',
  'Mockups',
]

// Pages each section fills. While a section is open, its pages move to the top of the
// preview, so the page being edited is always in view (see specs/brandmanual.md).
export const SECTION_PAGES: Record<string, string[]> = {
  cover: ['Cover'],
  logo: ['Brand concept', 'Anatomy', 'Logo versions', 'Clear space'],
  usage: ['Correct use', 'Incorrect use'],
  colors: ['Color palette'],
  typography: ['Typography'],
  skin: ['Brand concept'], // the first page the Skin paints (the Cover keeps its own colors)
  mockups: ['Mockups'],
}

// The four areas of the Logo form and the page each one fills. While the user works in an
// area (typing in it or scrolling to it), its page is the main one: first in the preview.
export const LOGO_AREA_PAGES: Record<string, string> = {
  concept: 'Brand concept',
  anatomy: 'Anatomy',
  versions: 'Logo versions',
  clearSpace: 'Clear space',
}

// The two groups of the Usage form and their pages: the group being worked in decides the
// main page, like the areas of the Logo form (see specs/usage.md)
export const USAGE_AREA_PAGES: Record<string, string> = {
  correct: 'Correct use',
  incorrect: 'Incorrect use',
}

// The areas of each section that has them, and the area a section starts on
export const SECTION_AREAS: Record<string, { pages: Record<string, string>; first: string }> = {
  logo: { pages: LOGO_AREA_PAGES, first: 'concept' },
  usage: { pages: USAGE_AREA_PAGES, first: 'correct' },
}

// The extra mockup pages (ADR 0036) come after the Mockups page, named "Mockups 2", "Mockups 3"…
// Their name says where they are, so a page's number never needs the whole list.
export function extraMockupsPage(index: number) {
  return `Mockups ${index + 1}` // index 1 → "Mockups 2"
}

// 1 for "Mockups 2", 2 for "Mockups 3"…; null for any other page
export function extraMockupsIndex(page: string): number | null {
  const match = /^Mockups (\d+)$/.exec(page)
  const index = match ? Number(match[1]) - 1 : 0
  return index >= 1 ? index : null
}

// Every page of the manual: the fixed ones, then the extra mockup pages
export function manualPages(extraCount = 0) {
  return [...MANUAL_PAGES, ...Array.from({ length: extraCount }, (_, i) => extraMockupsPage(i + 1))]
}

// A page's place in the manual's natural order, the Cover being 1; 0 for an unknown page
export function pageNumber(page: string): number {
  const extra = extraMockupsIndex(page)
  return extra === null ? MANUAL_PAGES.indexOf(page) + 1 : MANUAL_PAGES.length + extra
}

// The featured pages first, in the order given, then every other page in its natural order.
export function orderPages(featured: string[], extraCount = 0) {
  const pages = manualPages(extraCount)
  return [...featured.filter((page) => pages.includes(page)), ...pages.filter((page) => !featured.includes(page))]
}
