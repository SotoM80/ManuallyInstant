import type { CSSProperties } from 'react'
import type { FontSize, FontStyleName, TitleStyle } from '../types'

export const FONT_FAMILIES = ['Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Playfair Display']

export const FONT_STYLES: Record<FontStyleName, CSSProperties> = {
  Regular: { fontWeight: 'normal', fontStyle: 'normal' },
  Bold: { fontWeight: 'bold', fontStyle: 'normal' },
  Italic: { fontWeight: 'normal', fontStyle: 'italic' },
  'Bold Italic': { fontWeight: 'bold', fontStyle: 'italic' },
}

export const FONT_SIZES: Record<FontSize, string> = {
  Small: '24px',
  Medium: '32px',
  Large: '48px',
}

export const DEFAULT_TITLE_STYLE: TitleStyle = {
  fontFamily: 'Roboto',
  fontStyle: 'Regular',
  fontSize: 'Medium',
}

// The title color is not here: it is the Typography color of the Cover (see colorPalette.ts).
export const STYLE_FIELDS: { key: keyof TitleStyle; label: string; options: readonly string[] }[] = [
  { key: 'fontFamily', label: 'Font family', options: FONT_FAMILIES },
  { key: 'fontStyle', label: 'Font style', options: Object.keys(FONT_STYLES) },
  { key: 'fontSize', label: 'Font size', options: Object.keys(FONT_SIZES) },
]

export function toTitleCss(style: TitleStyle): CSSProperties {
  return {
    fontFamily: `'${style.fontFamily}', sans-serif`,
    fontSize: FONT_SIZES[style.fontSize],
    ...FONT_STYLES[style.fontStyle],
  }
}
