import { useSyncExternalStore } from 'react'
import { MOCKUP_GROUPS, MOCKUP_PRODUCTS } from './products'
import { PHOTO_TEMPLATES } from './templates'
import type { MockupItem, PhotoTemplate } from './types'

// Everything the Mockups list offers: the illustrations, the photo templates the app ships, and
// photo templates added in this session (a local test file now, the template editor later).
// Kept in one place so the list, the page and the PDF copy always agree (see specs/mockups.md).
let added: PhotoTemplate[] = []
let snapshot: MockupItem[] = sortByGroup([...MOCKUP_PRODUCTS, ...PHOTO_TEMPLATES])
const listeners = new Set<() => void>()

// In the order of the groups; within a group, in the order they were listed
function sortByGroup(items: MockupItem[]) {
  const groups = MOCKUP_GROUPS.map((group) => group.group)
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => groups.indexOf(a.item.group) - groups.indexOf(b.item.group) || a.index - b.index)
    .map(({ item }) => item)
}

export function mockupCatalog() {
  return snapshot
}

export function findMockup(id: string) {
  return snapshot.find((item) => item.id === id)
}

// Replaces a template for this session, or adds it: the template editor's "Use now"
export function savePhotoTemplate(template: PhotoTemplate) {
  added = [...added.filter((other) => other.id !== template.id), template]
  const shipped = [...MOCKUP_PRODUCTS, ...PHOTO_TEMPLATES].filter((item) => item.id !== template.id)
  snapshot = sortByGroup([...shipped, ...added])
  listeners.forEach((listener) => listener())
}

// Adds photo templates for this session (an id already listed, or repeated, is skipped)
export function addPhotoTemplates(templates: PhotoTemplate[]) {
  const fresh = templates.filter(
    (template, i) =>
      !snapshot.some((item) => item.id === template.id) && templates.findIndex((other) => other.id === template.id) === i,
  )
  if (fresh.length === 0) return
  added = [...added, ...fresh]
  snapshot = sortByGroup([
    ...[...MOCKUP_PRODUCTS, ...PHOTO_TEMPLATES].filter((item) => !added.some((other) => other.id === item.id)),
    ...added,
  ])
  listeners.forEach((listener) => listener())
}

// Forgets every template of this session (a refresh does the same): for tests, which share this module
export function resetSessionTemplates() {
  added = []
  snapshot = sortByGroup([...MOCKUP_PRODUCTS, ...PHOTO_TEMPLATES])
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// The list, re-rendering whoever uses it when templates are added
export function useMockupCatalog() {
  return useSyncExternalStore(subscribe, mockupCatalog)
}

// A photo template read from a file: only what the app needs, checked
export function isPhotoTemplate(value: unknown): value is PhotoTemplate {
  const t = value as PhotoTemplate
  return (
    typeof t === 'object' &&
    t !== null &&
    t.kind === 'photo' &&
    typeof t.id === 'string' &&
    typeof t.name === 'string' &&
    MOCKUP_GROUPS.some((group) => group.group === t.group) &&
    typeof t.image === 'string' &&
    Array.isArray(t.size) &&
    (Array.isArray(t.mask) || typeof t.maskImage === 'string') &&
    typeof t.area?.width === 'number' &&
    /^#[0-9A-Fa-f]{6}$/.test(t.color)
  )
}

// Photo templates for local tests only (public/mockups/local-templates.json, never shipped:
// see .gitignore and public/mockups/LICENSES.md). Missing or wrong, it adds nothing.
export async function loadLocalTemplates(fetchFile: typeof fetch | undefined = globalThis.fetch) {
  if (!fetchFile) return
  try {
    const response = await fetchFile('/mockups/local-templates.json')
    if (!response.ok) return
    const data: unknown = await response.json()
    if (Array.isArray(data)) addPhotoTemplates(data.filter(isPhotoTemplate))
  } catch {
    // No local templates: nothing to add
  }
}
