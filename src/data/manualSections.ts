export type ManualSection = {
  id: string
  label: string
  ready: boolean // false → shown disabled as "Coming soon"
}

// Sections of the Brand Manual page (right column), in order.
// When a section is built: set `ready: true` and plug its form in BrandManualPage.
export const MANUAL_SECTIONS: ManualSection[] = [
  { id: 'brand-title', label: 'Brand title', ready: true },
  { id: 'logo', label: 'Logo', ready: false },
  { id: 'colors', label: 'Colors', ready: false },
  { id: 'typography', label: 'Typography', ready: false },
]

// Pages of the manual shown in the preview (left column), in order.
export const MANUAL_PAGES = ['Cover', 'Logo', 'Color palette', 'Typography']
