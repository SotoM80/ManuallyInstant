import type { BrandFonts } from '../types'

export type FontCategory = 'Sans' | 'Serif' | 'Display' | 'Mono'

// Google Fonts the user can pick for the brand (Typography section), in the order shown.
export const BRAND_FONTS: { family: string; category: FontCategory }[] = [
  { family: 'Inter', category: 'Sans' },
  { family: 'Roboto', category: 'Sans' },
  { family: 'Open Sans', category: 'Sans' },
  { family: 'Lato', category: 'Sans' },
  { family: 'Montserrat', category: 'Sans' },
  { family: 'Poppins', category: 'Sans' },
  { family: 'Raleway', category: 'Sans' },
  { family: 'Nunito', category: 'Sans' },
  { family: 'Work Sans', category: 'Sans' },
  { family: 'DM Sans', category: 'Sans' },
  { family: 'Playfair Display', category: 'Serif' },
  { family: 'Merriweather', category: 'Serif' },
  { family: 'Lora', category: 'Serif' },
  { family: 'Libre Baskerville', category: 'Serif' },
  { family: 'Cormorant Garamond', category: 'Serif' },
  { family: 'Bebas Neue', category: 'Display' },
  { family: 'Abril Fatface', category: 'Display' },
  { family: 'Oswald', category: 'Display' },
  { family: 'JetBrains Mono', category: 'Mono' },
  { family: 'Space Mono', category: 'Mono' },
]

export const BRAND_FONT_FAMILIES = BRAND_FONTS.map((font) => font.family)

export const DEFAULT_BRAND_FONTS: BrandFonts = {
  primary: 'Montserrat',
  secondary: 'Open Sans',
}

// What the browser draws until the font arrives (Display fonts look closest to sans-serif).
const FALLBACKS: Record<FontCategory, string> = {
  Sans: 'sans-serif',
  Serif: 'serif',
  Display: 'sans-serif',
  Mono: 'monospace',
}

// "Playfair Display" → "'Playfair Display', serif"
export function toFontFamilyCss(family: string) {
  const category = BRAND_FONTS.find((font) => font.family === family)?.category ?? 'Sans'
  return `'${family}', ${FALLBACKS[category]}`
}
