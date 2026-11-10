import type { CSSProperties } from 'react'
import type { FontSize, FontStyleName, TitleStyle } from '../types'

export const FONT_FAMILIES = ['Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Playfair Display']

export const FONT_STYLES: Record<FontStyleName, CSSProperties> = {
  Regular: { fontWeight: 'normal', fontStyle: 'normal' },
  Bold: { fontWeight: 'bold', fontStyle: 'normal' },
  Italic: { fontWeight: 'normal', fontStyle: 'italic' },
  'Bold Italic': { fontWeight: 'bold', fontStyle: 'italic' },
}

// Measured on the page (cqw: a hundredth of its width), so the Cover looks the same in every view
// and in the PDF, and a title breaks into the same lines everywhere (specs/cover.md, ADR 0027).
// Today's Grid look: 12, 16 and 24 px on a Grid page 460 px wide.
export const FONT_SIZES: Record<FontSize, string> = {
  Small: '2.6cqw',
  Medium: '3.5cqw',
  Large: '5.2cqw',
}

export const DEFAULT_TITLE_STYLE: TitleStyle = {
  fontFamily: 'Roboto',
  fontStyle: 'Regular',
  fontSize: 'Medium',
}

// The title color is not here: it is the Title color of the Cover (see colorPalette.ts).
export const STYLE_FIELDS: { key: keyof TitleStyle; label: string; options: readonly string[] }[] = [
  { key: 'fontFamily', label: 'Font family', options: FONT_FAMILIES },
  { key: 'fontStyle', label: 'Font style', options: Object.keys(FONT_STYLES) },
  { key: 'fontSize', label: 'Font size', options: Object.keys(FONT_SIZES) },
]

export const TITLE_LINE_HEIGHT = 1.15

export function toTitleCss(style: TitleStyle): CSSProperties {
  return {
    fontFamily: `'${style.fontFamily}', sans-serif`,
    // Read by .cover-title (shared.css) as its font-size: passed as a variable because a cqw size
    // set inline is dropped by the test DOM (jsdom); the browser draws the same either way
    '--cover-title-size': FONT_SIZES[style.fontSize],
    // A proportion, never a length: the page inherits the site's 145% as a fixed 26px, which
    // made the lines of a Large title overlap (specs/titlefild.md, Scenario 6)
    // Times the Cover's Titles line spacing (specs/linespacing.md): calc() of two numbers is still a number
    lineHeight: `calc(${TITLE_LINE_HEIGHT} * var(--title-leading, 1))`,
    ...FONT_STYLES[style.fontStyle],
  } as CSSProperties
}
