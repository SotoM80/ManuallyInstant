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
  { id: 'colors', label: 'Colors', ready: true },
  { id: 'typography', label: 'Typography', ready: true },
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
  clearSpace: false,
}

// Pages of the manual shown in the preview (left column), in order.
// The Logo section fills four pages: Brand concept, Anatomy, Logo versions and Clear space.
export const MANUAL_PAGES = [
  'Cover',
  'Brand concept',
  'Anatomy',
  'Logo versions',
  'Clear space',
  'Color palette',
  'Typography',
]

// Pages each section fills. While a section is open, its pages move to the top of the
// preview, so the page being edited is always in view (see specs/brandmanual.md).
export const SECTION_PAGES: Record<string, string[]> = {
  cover: ['Cover'],
  logo: ['Brand concept', 'Anatomy', 'Logo versions', 'Clear space'],
  colors: ['Color palette'],
  typography: ['Typography'],
}

// The four areas of the Logo form and the page each one fills. While the user works in an
// area (typing in it or scrolling to it), its page is the main one: first in the preview.
export const LOGO_AREA_PAGES: Record<string, string> = {
  concept: 'Brand concept',
  anatomy: 'Anatomy',
  versions: 'Logo versions',
  clearSpace: 'Clear space',
}

// The featured pages first, in the order given, then every other page in its natural order.
export function orderPages(featured: string[]) {
  return [
    ...featured.filter((page) => MANUAL_PAGES.includes(page)),
    ...MANUAL_PAGES.filter((page) => !featured.includes(page)),
  ]
}
