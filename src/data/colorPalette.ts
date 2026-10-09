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

export const DEFAULT_TYPOGRAPHY_COLOR = '#000000'
export const DEFAULT_BACKGROUND_COLOR = '#FFFFFF'

export const INVALID_HEX_MESSAGE = 'Enter a valid HEX color, like #1E88E5'

// Accepts "#1e88e5", "1E88E5", "#18e" or "18E" and returns "#1E88E5" (or null if invalid).
export function normalizeHex(value: string): string | null {
  const hex = value.trim().replace(/^#/, '').toUpperCase()
  if (/^[0-9A-F]{6}$/.test(hex)) return `#${hex}`
  if (/^[0-9A-F]{3}$/.test(hex)) return `#${[...hex].map((c) => c + c).join('')}`
  return null
}
