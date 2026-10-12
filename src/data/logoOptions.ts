import type { LogoSize } from '../types'

// Share of the logo's area on the Cover (Large = the whole area, see specs/cover.md).
export const LOGO_SCALES: Record<LogoSize, number> = {
  Small: 0.5,
  Medium: 0.75,
  Large: 1,
}

export const LOGO_SIZES = Object.keys(LOGO_SCALES) as LogoSize[]

export const DEFAULT_LOGO_SIZE: LogoSize = 'Medium'
