import { versionName } from '../data/logoCopy'
import { findMockup, mockupCatalog } from './catalog'
import type { Blend, MockupItem, MockupSettings, Mockups, Placement } from './types'
import type { CoverData, LogoData } from '../types'

// The Mockups section's choice (see specs/mockups.md). Every function returns a new choice, so
// the form only calls them and passes the result on, like src/skins/layers.ts.
export const MAX_MOCKUPS = 4

// The logo centered in its area, filling it, straight; and printed on the photo
export const DEFAULT_PLACEMENT: Placement = { x: 0, y: 0, scale: 1, rotate: 0 }
export const DEFAULT_BLEND: Blend = 'printed'

// One product of each group to start with, so the page has content from the start
const DEFAULT_CHOSEN = ['business-card', 't-shirt', 'mug', 'phone']

export function defaultSettings(item: Pick<MockupItem, 'color'>): MockupSettings {
  return { color: item.color, version: null, placement: DEFAULT_PLACEMENT, blend: DEFAULT_BLEND }
}

export const DEFAULT_MOCKUPS: Mockups = {
  chosen: mockupCatalog()
    .map((item) => item.id)
    .filter((id) => DEFAULT_CHOSEN.includes(id)),
  settings: Object.fromEntries(mockupCatalog().map((item) => [item.id, defaultSettings(item)])),
}

// A product's settings; a template added after the start gets its defaults
export function settingsFor(mockups: Mockups, item: MockupItem): MockupSettings {
  return mockups.settings[item.id] ?? defaultSettings(item)
}

// Ticks or unticks a product, keeping the order of the list and at most four
export function toggleMockup(mockups: Mockups, id: string, order = mockupCatalog().map((item) => item.id)): Mockups {
  const ticked = mockups.chosen.includes(id)
  if (!ticked && mockups.chosen.length >= MAX_MOCKUPS) return mockups
  const chosen = ticked ? mockups.chosen.filter((other) => other !== id) : [...mockups.chosen, id]
  return { ...mockups, chosen: chosen.sort((a, b) => order.indexOf(a) - order.indexOf(b)) }
}

function setSetting(mockups: Mockups, id: string, change: Partial<MockupSettings>): Mockups {
  const item = findMockup(id)
  const current = mockups.settings[id] ?? (item ? defaultSettings(item) : defaultSettings({ color: '#FFFFFF' }))
  return { ...mockups, settings: { ...mockups.settings, [id]: { ...current, ...change } } }
}

export function setMockupColor(mockups: Mockups, id: string, color: string) {
  return setSetting(mockups, id, { color })
}

// The id of a logo version, or null for the Primary
export function setMockupVersion(mockups: Mockups, id: string, version: number | null) {
  return setSetting(mockups, id, { version })
}

export function setMockupPlacement(mockups: Mockups, id: string, placement: Placement) {
  return setSetting(mockups, id, { placement })
}

export function setMockupBlend(mockups: Mockups, id: string, blend: Blend) {
  return setSetting(mockups, id, { blend })
}

// The version a mockup really uses: its id while that version exists (and is not the Primary),
// otherwise null, the Primary. This is also what its Logo select shows.
export function chosenVersion(logo: LogoData | null, version: number | null) {
  const others = logo?.variants.slice(1) ?? []
  return version !== null && others.some((variant) => variant.id === version) ? version : null
}

// The logo a mockup shows: the chosen version's image, else the Primary's, else the Cover's logo,
// else null (a dashed box). A version with no image yet stays chosen; it just falls back meanwhile.
export function mockupLogo(logo: LogoData | null, coverLogo: { url: string } | null, version: number | null) {
  const id = chosenVersion(logo, version)
  const chosen = id === null ? null : logo?.variants.find((variant) => variant.id === id)?.image
  return chosen ?? logo?.variants[0]?.image ?? coverLogo ?? null
}

// The Logo select's options: the Primary as "Horizontal (Primary)" (or "Primary"), then the others
// named as on the Logo versions page
export function versionOptions(logo: LogoData | null) {
  const [primary, ...others] = logo?.variants ?? []
  return [
    { value: null, label: primary?.name.trim() ? `${primary.name.trim()} (Primary)` : 'Primary' },
    ...others.map((variant, i) => ({ value: variant.id, label: versionName(variant.name, i + 1) })),
  ]
}

// The brand line of the page: the Logo section's brand name, else the Cover title, else none
export function mockupsBrand(logo: LogoData | null, cover: CoverData | null) {
  return logo?.brandName.trim() || cover?.title.trim() || ''
}
