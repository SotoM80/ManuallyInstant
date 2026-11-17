import { versionName } from '../data/logoCopy'
import { manualPages } from '../data/manualSections'
import { findMockup, mockupCatalog } from './catalog'
import type { Blend, ExtraLayout, MockupItem, MockupSettings, MockupVersion, Mockups, Orientation, Placement } from './types'
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

// Ticks or unticks a product, keeping the order of the list and at most four. A photo of the
// extra pages that is ticked moves to the Mockups page (ADR 0036).
export function toggleMockup(mockups: Mockups, id: string, order = mockupCatalog().map((item) => item.id)): Mockups {
  const ticked = mockups.chosen.includes(id)
  if (!ticked && mockups.chosen.length >= MAX_MOCKUPS) return mockups
  const chosen = ticked ? mockups.chosen.filter((other) => other !== id) : [...mockups.chosen, id]
  const next = { ...mockups, chosen: chosen.sort((a, b) => order.indexOf(a) - order.indexOf(b)) }
  return !ticked && extraPhotos(mockups).includes(id) ? removeExtra(next, id) : next
}

// The extra mockup pages (ADR 0036): photos that did not fit on the Mockups page
export const MAX_EXTRA = 24
export const EXTRA_LIMITS = { cols: { min: 1, max: 3 }, rows: { min: 1, max: 3 }, margin: { min: 0, max: 20 } }
export const DEFAULT_EXTRA_LAYOUT: ExtraLayout = { cols: 1, rows: 1, margin: 8 }

export function extraPhotos(mockups: Mockups): string[] {
  return mockups.extra ?? []
}

export function extraLayout(mockups: Mockups): ExtraLayout {
  return mockups.extraLayout ?? DEFAULT_EXTRA_LAYOUT
}

// The photos on a page of their own, whatever the grid (Own page)
export function ownPagePhotos(mockups: Mockups): string[] {
  return mockups.extraOwn ?? []
}

// The extra pages, in order, each with its photos: the photos fill the Columns × Rows grid one
// after the other, and a photo marked Own page takes a whole page by itself
export function extraPages(mockups: Mockups): string[][] {
  const { cols, rows } = extraLayout(mockups)
  const perPage = cols * rows
  const own = ownPagePhotos(mockups)
  const pages: string[][] = []
  let grid: string[] | null = null
  for (const id of extraPhotos(mockups)) {
    if (own.includes(id)) {
      pages.push([id])
      grid = null
    } else {
      if (!grid || grid.length >= perPage) {
        grid = []
        pages.push(grid)
      }
      grid.push(id)
    }
  }
  return pages
}

// How many extra pages the photos fill, with the chosen grid
export function extraPageCount(mockups: Mockups): number {
  return extraPages(mockups).length
}

// Every page of the manual with these mockups: the fixed pages, then the extra mockup pages
export function pagesWith(mockups: Mockups): string[] {
  return manualPages(extraPageCount(mockups))
}

// The photos of one extra page (1 → the first), row by row
export function extraPagePhotos(mockups: Mockups, page: number): string[] {
  return extraPages(mockups)[page - 1] ?? []
}

// The grid of one extra page: 1 × 1 for a photo on a page of its own
export function extraPageLayout(mockups: Mockups, page: number): ExtraLayout {
  const layout = extraLayout(mockups)
  const photos = extraPagePhotos(mockups, page)
  return photos.length === 1 && ownPagePhotos(mockups).includes(photos[0]) ? { ...layout, cols: 1, rows: 1 } : layout
}

// The extra page (1 → the first) a photo is on, or null
export function extraPageOf(mockups: Mockups, id: string): number | null {
  const index = extraPages(mockups).findIndex((photos) => photos.includes(id))
  return index < 0 ? null : index + 1
}

// Takes a photo off the Mockups page and gives it a page of its own, after the other extra pages
export function moveToOwnPage(mockups: Mockups, id: string): Mockups {
  if (extraPhotos(mockups).length >= MAX_EXTRA) return mockups
  const moved = {
    ...mockups,
    chosen: mockups.chosen.filter((other) => other !== id),
    extra: [...extraPhotos(mockups).filter((other) => other !== id), id],
  }
  return setOwnPage(moved, id, true)
}

export function setOwnPage(mockups: Mockups, id: string, own: boolean): Mockups {
  const others = ownPagePhotos(mockups).filter((other) => other !== id)
  return { ...mockups, extraOwn: own ? [...others, id] : others }
}

// Where Use now puts a new template: ticked when the Mockups page has no mockup yet; otherwise
// on a new extra page, with no logo (it often carries one already), while they have room
export type NewMockupPlace = 'page' | 'extra' | 'full'

export function placeNewMockup(
  mockups: Mockups,
  item: Pick<MockupItem, 'id' | 'color'>,
  order?: string[],
): { mockups: Mockups; place: NewMockupPlace } {
  if (mockups.chosen.includes(item.id) || extraPhotos(mockups).includes(item.id)) return { mockups, place: 'page' }
  if (mockups.chosen.length === 0) return { mockups: toggleMockup(mockups, item.id, order), place: 'page' }
  if (extraPhotos(mockups).length >= MAX_EXTRA) return { mockups, place: 'full' }
  const settings = { ...(mockups.settings[item.id] ?? defaultSettings(item)), version: 'none' as const }
  return {
    mockups: {
      ...mockups,
      extra: [...extraPhotos(mockups), item.id],
      settings: { ...mockups.settings, [item.id]: settings },
    },
    place: 'extra',
  }
}

export function removeExtra(mockups: Mockups, id: string): Mockups {
  return {
    ...mockups,
    extra: extraPhotos(mockups).filter((other) => other !== id),
    extraOwn: ownPagePhotos(mockups).filter((other) => other !== id),
  }
}

// Moves a photo of the extra pages one place up (-1) or down (+1)
export function moveExtra(mockups: Mockups, id: string, step: -1 | 1): Mockups {
  const extra = [...extraPhotos(mockups)]
  const from = extra.indexOf(id)
  const to = from + step
  if (from < 0 || to < 0 || to >= extra.length) return mockups
  ;[extra[from], extra[to]] = [extra[to], extra[from]]
  return { ...mockups, extra }
}

function clamp(value: number, { min, max }: { min: number; max: number }) {
  return Math.min(max, Math.max(min, Math.round(value)))
}

export function setExtraLayout(mockups: Mockups, change: Partial<ExtraLayout>): Mockups {
  const next = { ...extraLayout(mockups), ...change }
  return {
    ...mockups,
    extraLayout: {
      cols: clamp(next.cols, EXTRA_LIMITS.cols),
      rows: clamp(next.rows, EXTRA_LIMITS.rows),
      margin: clamp(next.margin, EXTRA_LIMITS.margin),
    },
  }
}

function setSetting(mockups: Mockups, id: string, change: Partial<MockupSettings>): Mockups {
  const item = findMockup(id)
  const current = mockups.settings[id] ?? (item ? defaultSettings(item) : defaultSettings({ color: '#FFFFFF' }))
  return { ...mockups, settings: { ...mockups.settings, [id]: { ...current, ...change } } }
}

export function setMockupColor(mockups: Mockups, id: string, color: string) {
  return setSetting(mockups, id, { color })
}

// The id of a logo version, null for the Primary, or 'none' for no logo
export function setMockupVersion(mockups: Mockups, id: string, version: MockupVersion) {
  return setSetting(mockups, id, { version })
}

export function setMockupPlacement(mockups: Mockups, id: string, placement: Placement) {
  return setSetting(mockups, id, { placement })
}

// Turning the logo centers it again (photo mockups), so the turned logo starts inside its area
export function setMockupOrientation(mockups: Mockups, id: string, orientation: Orientation) {
  const item = findMockup(id)
  const current = mockups.settings[id] ?? (item ? defaultSettings(item) : defaultSettings({ color: '#FFFFFF' }))
  return setSetting(mockups, id, { orientation, placement: { ...current.placement, x: 0, y: 0 } })
}

export function setMockupBlend(mockups: Mockups, id: string, blend: Blend) {
  return setSetting(mockups, id, { blend })
}

// The version a mockup really uses: its id while that version exists (and is not the Primary),
// 'none' for no logo, otherwise null, the Primary. This is also what its Logo select shows.
export function chosenVersion(logo: LogoData | null, version: MockupVersion): MockupVersion {
  if (version === 'none') return 'none'
  const others = logo?.variants.slice(1) ?? []
  return version !== null && others.some((variant) => variant.id === version) ? version : null
}

// The logo a mockup shows: none with No logo; else the chosen version's image, else the Primary's,
// else the Cover's logo, else null (a dashed box). A version with no image yet stays chosen; it
// just falls back meanwhile.
export function mockupLogo(logo: LogoData | null, coverLogo: { url: string } | null, version: MockupVersion) {
  if (version === 'none') return null
  const id = chosenVersion(logo, version)
  const chosen = id === null ? null : logo?.variants.find((variant) => variant.id === id)?.image
  return chosen ?? logo?.variants[0]?.image ?? coverLogo ?? null
}

// The Logo select's options: the Primary as "Horizontal (Primary)" (or "Primary"), then the others
// named as on the Logo versions page, then No logo
export function versionOptions(logo: LogoData | null): { value: MockupVersion; label: string }[] {
  const [primary, ...others] = logo?.variants ?? []
  return [
    { value: null, label: primary?.name.trim() ? `${primary.name.trim()} (Primary)` : 'Primary' },
    ...others.map((variant, i) => ({ value: variant.id, label: versionName(variant.name, i + 1) })),
    { value: 'none', label: 'No logo' },
  ]
}

// The Logo select's value for a version, and back
export function versionValue(version: MockupVersion): string {
  return version === null ? 'primary' : String(version)
}

export function parseVersionValue(value: string): MockupVersion {
  return value === 'primary' ? null : value === 'none' ? 'none' : Number(value)
}

// The brand line of the page: the Logo section's brand name, else the Cover title, else none
export function mockupsBrand(logo: LogoData | null, cover: CoverData | null) {
  return logo?.brandName.trim() || cover?.title.trim() || ''
}
