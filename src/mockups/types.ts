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
  id: string
  name: string
  group: MockupGroup
  color: string // the default color, "#RRGGBB"
  colorLabel: string // what the color paints: "Product color", or "Icon color" for the Phone
  viewBox: [number, number]
  parts: MockupPart[]
  logo: MockupLogoBox
}

// What the user set for a product: its color, and the id of its logo version (null → the Primary)
export type MockupSettings = { color: string; version: number | null }

// The ticked products, always in the order of the list, and the settings of every product,
// ticked or not, so an unticked product keeps them
export type Mockups = {
  chosen: string[]
  settings: Record<string, MockupSettings>
}
