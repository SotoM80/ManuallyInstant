export type FontStyleName = 'Regular' | 'Bold' | 'Italic' | 'Bold Italic'

export type FontSize = 'Small' | 'Medium' | 'Large'

export type Orientation = 'portrait' | 'landscape'

export type PreviewView = 'grid' | 'overview' | 'pages'

export type TitleStyle = {
  fontFamily: string
  fontStyle: FontStyleName
  fontSize: FontSize
}

export type LogoSize = 'Small' | 'Medium' | 'Large'

export type Logo = {
  url: string // object URL of the uploaded file (lives only in this session)
  name: string
  size: LogoSize // how much of its area the logo fills on the Cover
}

// Everything the Cover section shows in the preview. Also reused by the Brand concept page.
// Text fields may be empty while the user types: the page shows a placeholder for them.
export type CoverData = {
  title: string
  style: TitleStyle
  designedBy: string
  logo: Logo | null // null → no logo applied yet
  colors: ManualColors
}

// Colors of the manual pages, as "#RRGGBB".
export type ManualColors = {
  title: string // the brand manual title
  text: string // the rest of the Cover's text: "Designed by" (and the divider of Template 3)
  background: string // background of every page
}

// One color of the brand palette (Colors section), with its HEX as "#RRGGBB".
// `id` stays the same while the color exists and is never reused, so whatever points
// at a color (a skin) keeps pointing at it when other colors are removed.
export type PaletteColor = {
  id: number
  name: string
  hex: string
}

// Kind of brand mark (Logo section): text only, symbol only, or both (see MARK_TYPE_LABELS).
export type MarkType = 'Logotype' | 'Imagotype' | 'Isologo' | 'Isotype'

// An uploaded image (object URL, lives only in this session) and its file name.
export type UploadedImage = {
  url: string
  name: string
}

// The two pages of the Usage section (see specs/usage.md)
export type UsageKind = 'correct' | 'incorrect'

// One example of a Usage page. `id` stays the same while it exists and is never reused.
export type UsageExample = {
  id: number
  description: string
  image: UploadedImage | null
  background: string | null // "#RRGGBB" behind the image, or none (specs/imagebackground.md)
}

// Each group is null until it is touched, so its page keeps its placeholder until then,
// whatever happens in the other group
export type UsageData = Record<UsageKind, UsageExample[] | null>

// One piece a mark is built from, e.g. Tagline / "Energy for all" / "States the promise".
// Everything is optional; the label falls back to "Part 1", "Part 2"…
export type MarkPart = {
  label: string
  name: string
  role: string
  image: UploadedImage | null
  background: string | null // "#RRGGBB" behind the image, or none (specs/imagebackground.md)
}

// One kind of mark the brand uses, shown as a card on the Brand concept page.
// Everything but the type is optional, e.g. Isotype / "Lightning symbol" / "Conveys energy".
// With parts, the page shows how it is built: Isotype + Logotype + Tagline = Imagotype.
export type MarkCard = {
  type: MarkType
  name: string
  role: string
  image: UploadedImage | null
  background: string | null // "#RRGGBB" behind the image, or none (specs/imagebackground.md)
  parts: MarkPart[] // 0 to 4
}

// One official version of the logo, e.g. "Horizontal" / "for web and long stationery".
// `id` stays the same while the version exists and is never reused, so whatever points at a
// version (a mockup, see specs/mockups.md) keeps pointing at it when others are removed.
export type LogoVariant = {
  id: number
  name: string
  usage: string
  image: UploadedImage | null // null → no image applied yet
  background: string | null // "#RRGGBB" behind the image, or none (specs/imagebackground.md)
}

// Everything the Logo section shows in the preview. It fills three pages: Brand concept, Logo versions
// and Clear space (see specs/logo.md).
export type LogoData = {
  brandName: string
  concept: string // the idea behind the design, in the user's words
  marks: MarkCard[] // the chosen mark types (at least one), in the order of MARK_TYPES
  variants: LogoVariant[] // 1 to 4; the first one is the Primary version
  clearSpaceUnit: string // what X measures, e.g. "the height of the letter X"
  minDigitalPx: number
  minPrintMm: number
  grid: UploadedImage | null // optional construction grid
  gridModules: number // squares across the logo in the grid the app draws when none is uploaded
  gridX: number // how many modules X measures: the clear space (3.1) and the grid margin (3.2)
  rulerTop: number[] // dimension line above the grid, in multiples of X (e.g. [1, 1.5, 1]); [] → none
  rulerSide: number[] // dimension line beside the grid, the same way
}

// The brand's two Google Fonts (Typography section), by family name.
export type BrandFonts = {
  primary: string // headings
  secondary: string // body text
}
