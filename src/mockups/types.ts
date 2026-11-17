// The Mockups section: the logo on products drawn by the app (see specs/mockups.md, ADR 0013)
export type MockupGroup = 'stationery' | 'apparel' | 'objects' | 'screens'

// A shape of a product, in the product's own viewBox. `fill` is the product's color, a fixed
// translucent shadow or light (for volume), or a fixed HEX. `outline` draws a faint edge, so a
// product as light as the page still shows. Everything becomes SVG attributes, never CSS classes.
export type MockupPart = {
  d: string
  fill: 'product' | 'shade' | 'light' | `#${string}`
  opacity?: number
  outline?: boolean
}

// Where the logo goes, in the product's viewBox: it is centered and kept in proportion in this box
export type MockupLogoBox = { x: number; y: number; width: number; height: number; rotate?: number }

export type MockupProduct = {
  kind: 'illustration'
  id: string
  name: string
  group: MockupGroup
  color: string // the default color, "#RRGGBB"
  colorLabel: string // what the color paints: "Product color", or "Icon color" for the Phone
  viewBox: [number, number]
  parts: MockupPart[]
  logo: MockupLogoBox
}

// Where the logo goes, as a grid of points in the photo's pixels, row by row (`rows` × `cols`):
// four corners for an area at an angle, more points across for a curve (see src/mockups/warp.ts)
export type AreaGrid = { cols: number; rows: number; points: [number, number][] }

// A real product photo the logo is composed on (see specs/mockups.md, Photo mockups, ADR 0014).
// Every measure is in the photo's own pixels. `mask` is the outline of the product (polygons),
// `area` where the logo goes; `tintable` is false for a product that keeps its own color.
export type PhotoTemplate = {
  kind: 'photo'
  id: string
  name: string
  group: MockupGroup
  image: string // the photo's URL, same origin (public/mockups/)
  size: [number, number]
  mask: [number, number][][] // one polygon per part of the product (e.g. two cards); [] with maskImage
  maskImage?: string // a mask drawn in the template editor (white = the product), used instead of `mask`
  area: { x: number; y: number; width: number; height: number } // the box around `grid`, or the area itself
  grid?: AreaGrid // the area's shape; without it, the corners of `area`
  color: string
  colorLabel: string
  tintable: boolean
  revision?: number // changes every time the template editor saves it, so nothing shows the old one
}

// Anything the list offers: an illustration drawn by the app, or a photo template
export type MockupItem = MockupProduct | PhotoTemplate

// Where the logo sits in its area (photo mockups): its center moved from the area's center by a
// share of the area's width and height, its size (1 → it fills the area) and its rotation in degrees
export type Placement = { x: number; y: number; scale: number; rotate: number }

// The logo as it is (Horizontal) or a quarter turn to the left, fitted again (Vertical, ADR 0037)
export type Orientation = 'horizontal' | 'vertical'

// A placement with the orientation it is drawn in: what the geometry and the composer read
export type LogoPlacement = Placement & { orientation?: Orientation }

// Printed: the logo multiplies with the photo (dark logos). Solid: laid over it (light logos).
export type Blend = 'printed' | 'solid'

// The logo a mockup carries: the id of a logo version, null for the Primary, or 'none' for no
// logo at all (a photo that already carries it, ADR 0036)
export type MockupVersion = number | null | 'none'

// What the user set for a product: its color, its logo version, and for photo mockups where the
// logo sits and how it blends, and the logo's orientation (none saved → Horizontal)
export type MockupSettings = {
  color: string
  version: MockupVersion
  placement: Placement
  blend: Blend
  orientation?: Orientation
}

// The grid and the margin of every extra mockup page: columns and rows 1–3, the margin in % of
// the page's width (ADR 0036)
export type ExtraLayout = { cols: number; rows: number; margin: number }

// The ticked products, always in the order of the list, and the settings of every product,
// ticked or not, so an unticked product keeps them. `extra` holds the photos of the extra
// mockup pages, in their order; none of them is ticked (ADR 0036).
export type Mockups = {
  chosen: string[]
  settings: Record<string, MockupSettings>
  extra?: string[]
  extraLayout?: ExtraLayout
  extraOwn?: string[] // the photos of the extra pages on a page of their own
}
