import type { CSSProperties } from 'react'
import type { FontColor, FontSize, FontStyleName, TitleStyle } from '../types'

export const FONT_FAMILIES = ['Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Playfair Display']

export const FONT_COLORS: Record<FontColor, string> = {
  Black: '#000000',
  White: '#FFFFFF',
  Red: '#E53935',
  Blue: '#1E88E5',
  Green: '#43A047',
  Yellow: '#FDD835',
  Gray: '#757575',
}

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
  color: 'Black',
  fontStyle: 'Regular',
  fontSize: 'Medium',
}

export const STYLE_FIELDS: { key: keyof TitleStyle; label: string; options: readonly string[] }[] = [
  { key: 'fontFamily', label: 'Font family', options: FONT_FAMILIES },
  { key: 'color', label: 'Font color', options: Object.keys(FONT_COLORS) },
  { key: 'fontStyle', label: 'Font style', options: Object.keys(FONT_STYLES) },
  { key: 'fontSize', label: 'Font size', options: Object.keys(FONT_SIZES) },
]

export function toTitleCss(style: TitleStyle): CSSProperties {
  return {
    fontFamily: `'${style.fontFamily}', sans-serif`,
    color: FONT_COLORS[style.color],
    fontSize: FONT_SIZES[style.fontSize],
    ...FONT_STYLES[style.fontStyle],
  }
}
