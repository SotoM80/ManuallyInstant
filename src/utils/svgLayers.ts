import { MARK_TYPE_LABELS } from '../data/logoCopy'
import type { VisibleBounds } from './visibleBounds'

// The layers of an SVG exported from Illustrator, each turned into an SVG of its own, to fill
// the parts of a mark card (see specs/logolayers.md and ADR 0015). Reading and cutting are pure
// and work in jsdom; finding where a layer is drawn needs the browser (measureSvg.ts), so it is
// passed in.

export type ViewBox = [number, number, number, number] // x, y, width, height

// A layer cut out of the file: its name as Illustrator wrote it, and an SVG with only it
export type SvgLayer = { name: string; svg: string }

export type ReadLayers = { layers: SvgLayer[]; viewBox: ViewBox } | null // null → not readable

// What a layer is drawn with; anything else (defs, style, title…) draws nothing on its own
const DRAWING = ['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'text', 'image', 'use']
// Drawings inside these are only used by reference, so they do not count
const NOT_DRAWN = ['defs', 'clipPath', 'mask', 'symbol', 'pattern', 'marker']
// Kept in every part: they draw nothing, and the layers may need them (styles, gradients…)
const SHARED = ['defs', 'style', 'title', 'desc', 'metadata']

const LAYER = 'data-layer-index' // marks the layers while the file is cut

function isHidden(element: Element) {
  const style = element.getAttribute('style') ?? ''
  return (
    element.getAttribute('display') === 'none' ||
    element.getAttribute('visibility') === 'hidden' ||
    /display\s*:\s*none|visibility\s*:\s*hidden/i.test(style)
  )
}

function drawsSomething(layer: Element) {
  return DRAWING.some((tag) =>
    Array.from(layer.getElementsByTagName(tag)).some((shape) => {
      for (let node = shape.parentElement; node && node !== layer; node = node.parentElement) {
        if (NOT_DRAWN.includes(node.localName)) return false
      }
      return true
    }),
  )
}

function groups(element: Element) {
  return Array.from(element.children).filter((child) => child.localName === 'g')
}

// The layers of the file: its top-level groups, or the children of a single outer group when
// they are all named groups (some Illustrator exports wrap the layers in one)
function findLayers(root: Element) {
  const top = groups(root)
  if (top.length === 1) {
    const inner = groups(top[0])
    const onlyGroups = Array.from(top[0].children).every((child) => child.localName === 'g' || SHARED.includes(child.localName))
    const named = inner.every((group) => group.hasAttribute('data-name') || group.hasAttribute('id'))
    if (inner.length >= 2 && onlyGroups && named) return inner
  }
  return top
}

function readViewBox(root: Element): ViewBox | null {
  const box = (root.getAttribute('viewBox') ?? '').trim().split(/[\s,]+/).map(Number)
  if (box.length === 4 && box.every(Number.isFinite) && box[2] > 0 && box[3] > 0) return box as ViewBox
  const width = parseFloat(root.getAttribute('width') ?? '')
  const height = parseFloat(root.getAttribute('height') ?? '')
  return width > 0 && height > 0 ? [0, 0, width, height] : null
}

// A layer's name: `data-name`, or its id with Illustrator's escapes undone (`Capa_1` → "Capa 1",
// `Logo_x5F_A` → "Logo_A", `Layer_1-2` → "Layer 1")
export function layerName(layer: Element) {
  const dataName = layer.getAttribute('data-name')?.trim()
  if (dataName) return dataName
  const id = layer.getAttribute('id') ?? ''
  return id
    .replace(/-\d+$/, '')
    .replace(/_/g, ' ')
    .replace(/ x([0-9a-f]{2,4}) /gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\s+/g, ' ')
    .trim()
}

// Reads the layers of an SVG, in the order of Illustrator's Layers panel (the top layer, drawn
// last in the file, first). Hidden layers and layers that draw nothing are left out.
export function readSvgLayers(text: string): ReadLayers {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml')
  const root = doc.documentElement
  if (root.localName !== 'svg' || doc.getElementsByTagName('parsererror').length > 0) return null
  const viewBox = readViewBox(root)
  if (!viewBox) return null

  const layers = findLayers(root).filter((layer) => !isHidden(layer) && drawsSomething(layer))
  layers.forEach((layer, index) => layer.setAttribute(LAYER, String(index)))
  // The outer group of a wrapped file stays in every part (it may move or scale the layers)
  const wrapper = layers[0]?.parentElement !== root ? layers[0]?.parentElement : null
  const serializer = new XMLSerializer()

  const cut = layers.map((layer, index) => {
    const copy = root.cloneNode(true) as Element
    for (const child of Array.from(copy.children)) {
      const keep = SHARED.includes(child.localName) || child.getAttribute(LAYER) === String(index) || (wrapper && child.localName === 'g' && !child.hasAttribute(LAYER))
      if (!keep) child.remove()
    }
    for (const other of Array.from(copy.querySelectorAll(`[${LAYER}]`))) {
      if (other.getAttribute(LAYER) !== String(index)) other.remove()
      else other.removeAttribute(LAYER)
    }
    copy.querySelectorAll('script').forEach((script) => script.remove())
    return { name: layerName(layer), svg: serializer.serializeToString(copy) }
  })
  return { layers: cut.reverse(), viewBox }
}

// Illustrator's own names for a new layer, in the languages it comes in: no name of the user's
const DEFAULT_NAME = /^(capa|layer|ebene|calque|livello|camada|laag|warstwa)\s*\d+$/i

function plain(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

const KNOWN_LABELS: [string[], string][] = [
  [['isotipo', 'isotype', 'simbolo', 'symbol', 'brandmark'], MARK_TYPE_LABELS.Isotype],
  [['logotipo', 'logotype', 'wordmark'], MARK_TYPE_LABELS.Logotype],
  [['tagline', 'eslogan', 'slogan'], 'Tagline'],
]

// The label of a part made from a layer: a known name becomes the label's suggestion, a default
// or missing one gives no label (the page then shows "Part N"), any other is kept
export function partLabel(name: string) {
  if (!name.trim() || DEFAULT_NAME.test(name.trim())) return ''
  const known = KNOWN_LABELS.find(([names]) => names.includes(plain(name)))
  return known ? known[1] : name.trim()
}

// `volta.svg` + "Isotipo" → `volta-Isotipo.svg`; a layer with no name of its own → `volta-part-2.svg`
export function layerFileName(fileName: string, layer: string, place: number) {
  const base = fileName.replace(/\.svg$/i, '')
  const safe = partLabel(layer) ? layer.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') : ''
  return `${base}-${safe || `part-${place}`}.svg`
}

function setRootAttributes(svg: string, attributes: Record<string, string>) {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  for (const [name, value] of Object.entries(attributes)) doc.documentElement.setAttribute(name, value)
  return new XMLSerializer().serializeToString(doc)
}

const round = (value: number) => String(Math.round(value * 1000) / 1000)

// The SVG drawn at a given size, for the canvas that measures it
export function sizedSvg(svg: string, width: number, height: number) {
  return setRootAttributes(svg, { width: String(width), height: String(height) })
}

// Cropped to the box where the layer is drawn (fractions of the file's canvas), with a margin
// of 2% of its longer side so anti-aliased edges are never cut
export function cropSvg(svg: string, viewBox: ViewBox, bounds: VisibleBounds) {
  const [x, y, width, height] = viewBox
  const boxWidth = bounds.width * width
  const boxHeight = bounds.height * height
  const margin = Math.max(boxWidth, boxHeight) * 0.02
  const box = [x + bounds.x * width - margin, y + bounds.y * height - margin, boxWidth + 2 * margin, boxHeight + 2 * margin]
  return setRootAttributes(svg, { viewBox: box.map(round).join(' '), width: round(box[2]), height: round(box[3]) })
}

// Two layers whose starts are closer than this (a fraction of the canvas) start at the same place
const SAME_PLACE = 0.01

// Reading order: left to right by where each layer starts, then top to bottom. Layers that could
// not be measured go last, in the order they came.
export function inReadingOrder<T extends { bounds: VisibleBounds | null }>(layers: T[]) {
  return [...layers].sort((a, b) => {
    if (!a.bounds || !b.bounds) return a.bounds ? -1 : b.bounds ? 1 : 0
    if (Math.abs(a.bounds.x - b.bounds.x) >= SAME_PLACE) return a.bounds.x - b.bounds.x
    return a.bounds.y - b.bounds.y
  })
}
