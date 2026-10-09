export type FontStyleName = 'Regular' | 'Bold' | 'Italic' | 'Bold Italic'

export type FontSize = 'Small' | 'Medium' | 'Large'

export type Orientation = 'portrait' | 'landscape'

export type PreviewView = 'grid' | 'pages'

export type TitleStyle = {
  fontFamily: string
  fontStyle: FontStyleName
  fontSize: FontSize
}

export type Logo = {
  url: string // object URL of the uploaded file (lives only in this session)
  name: string
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
