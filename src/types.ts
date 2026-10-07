export type FontColor = 'Black' | 'White' | 'Red' | 'Blue' | 'Green' | 'Yellow' | 'Gray'

export type FontStyleName = 'Regular' | 'Bold' | 'Italic' | 'Bold Italic'

export type FontSize = 'Small' | 'Medium' | 'Large'

export type Orientation = 'portrait' | 'landscape'

export type TitleStyle = {
  fontFamily: string
  color: FontColor
  fontStyle: FontStyleName
  fontSize: FontSize
}
