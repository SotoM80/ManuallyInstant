import { createContext, useContext } from 'react'
import { hexToRgb, rgbToCmyk } from '../data/colorPalette'
import type { Cmyk } from '../data/colorPalette'
import type { CmykProfileInfo } from '../export/cmykClient'

// The CMYK value of a color: from the server's profile (`exact`), or approximate (specs/colorpalette.md)
export type CmykValue = { cmyk: Cmyk; exact: boolean }

export type CmykValues = {
  profile: CmykProfileInfo | null // the server's profile, once it has answered
  valuesOf: (hex: string) => CmykValue
  ready: (hexes: string[]) => Promise<void> // the export waits for these before drawing; throws CmykServerError
}

export const approximate = (hex: string): CmykValue => ({ cmyk: rgbToCmyk(hexToRgb(hex)), exact: false })

// With no provider, or no server, every value is approximate, as before ADR 0019
export const NO_SERVER: CmykValues = { profile: null, valuesOf: approximate, ready: async () => {} }

// Filled by CmykProvider (src/components/CmykProvider.tsx)
export const CmykContext = createContext<CmykValues>(NO_SERVER)

export function useCmyk() {
  return useContext(CmykContext)
}
