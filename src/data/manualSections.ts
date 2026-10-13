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
// "Coming soon" in the form and on its page, and is not checked on Save.
// When a part is built: set it to true (its form and page are already plugged in).
export type LogoParts = {
  versions: boolean // Versions group → Logo versions page
  clearSpace: boolean // Clear space & size group → Clear space page
}

export const LOGO_PARTS: LogoParts = {
  versions: false,
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
