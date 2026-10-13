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

// Everything the Cover section saves. Also reused by the Logo page later.
export type CoverData = {
  title: string
  style: TitleStyle
  designedBy: string
  logo: Logo
  colors: ManualColors
}

// Colors of the manual pages, as "#RRGGBB".
export type ManualColors = {
  typography: string // title and "Designed by"
  background: string // background of every page
}

// One color of the brand palette (Colors section), with its HEX as "#RRGGBB".
export type PaletteColor = {
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

// One piece a mark is built from, e.g. Tagline / "Energy for all" / "States the promise".
// Everything is optional; the label falls back to "Part 1", "Part 2"…
export type MarkPart = {
  label: string
  name: string
  role: string
  image: UploadedImage | null
}

// One kind of mark the brand uses, shown as a card on the Brand concept page.
// Everything but the type is optional, e.g. Isotype / "Lightning symbol" / "Conveys energy".
// With parts, the page shows how it is built: Isotype + Logotype + Tagline = Imagotype.
export type MarkCard = {
  type: MarkType
  name: string
  role: string
  image: UploadedImage | null
  parts: MarkPart[] // 0 to 4
}

// One official version of the logo, e.g. "Horizontal" / "for web and long stationery".
export type LogoVariant = {
  name: string
  usage: string
  image: UploadedImage
}

// Everything the Logo section saves. It fills three pages: Brand concept, Logo versions
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
}

// The brand's two Google Fonts (Typography section), by family name.
export type BrandFonts = {
  primary: string // headings
  secondary: string // body text
}
