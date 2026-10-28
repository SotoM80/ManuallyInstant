// Quick swatches of the color picker, in the order shown.
export const PALETTE: { name: string; hex: string }[] = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Gray', hex: '#757575' },
  { name: 'Beige', hex: '#F5F0E6' },
  { name: 'Red', hex: '#E53935' },
  { name: 'Orange', hex: '#FB8C00' },
  { name: 'Yellow', hex: '#FDD835' },
  { name: 'Green', hex: '#43A047' },
  { name: 'Teal', hex: '#00897B' },
  { name: 'Blue', hex: '#1E88E5' },
  { name: 'Navy', hex: '#1A237E' },
  { name: 'Purple', hex: '#8E24AA' },
]

export const DEFAULT_TITLE_COLOR = '#000000'
export const DEFAULT_TEXT_COLOR = '#000000'
export const DEFAULT_BACKGROUND_COLOR = '#FFFFFF'

export const INVALID_HEX_MESSAGE = 'Enter a valid HEX color, like #1E88E5'

// Accepts "#1e88e5", "1E88E5", "#18e" or "18E" and returns "#1E88E5" (or null if invalid).
export function normalizeHex(value: string): string | null {
  const hex = value.trim().replace(/^#/, '').toUpperCase()
  if (/^[0-9A-F]{6}$/.test(hex)) return `#${hex}`
  if (/^[0-9A-F]{3}$/.test(hex)) return `#${[...hex].map((c) => c + c).join('')}`
  return null
}

export type Rgb = { r: number; g: number; b: number }

// "#1E88E5" → { r: 30, g: 136, b: 229 }. Expects a normalized HEX (see normalizeHex).
export function hexToRgb(hex: string): Rgb {
  const value = parseInt(hex.slice(1), 16)
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 }
}

// { r: 30, g: 136, b: 229 } → "#1E88E5"
export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

export type Cmyk = { c: number; m: number; y: number; k: number }

// Naive, approximate CMYK (ADR 0003), as whole percentages.
// { r: 30, g: 136, b: 229 } → { c: 87, m: 41, y: 0, k: 10 }
export function rgbToCmyk({ r, g, b }: Rgb): Cmyk {
  const [red, green, blue] = [r, g, b].map((channel) => channel / 255)
  const k = 1 - Math.max(red, green, blue)
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 } // pure black: avoids dividing by 0
  const ink = (channel: number) => Math.round(((1 - channel - k) / (1 - k)) * 100)
  return { c: ink(red), m: ink(green), y: ink(blue), k: Math.round(k * 100) }
}

// { c: 76, m: 42, y: 0, k: 0 } → "76, 42, 0, 0"
export function formatCmyk({ c, m, y, k }: Cmyk) {
  return `${c}, ${m}, ${y}, ${k}`
}

// The three values shown for a palette color, as text ("#1E88E5", "30, 136, 229", "87, 41, 0, 10").
// `cmyk` is the CMYK server's value for the color when there is one (specs/colorpalette.md);
// without it, the approximate one.
export function colorValues(hex: string, cmyk: Cmyk = rgbToCmyk(hexToRgb(hex))) {
  const rgb = hexToRgb(hex)
  return { hex, rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`, cmyk: formatCmyk(cmyk) }
}
