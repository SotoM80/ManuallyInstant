import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Cmyk } from '../data/colorPalette'
import { fetchCmykColors } from '../export/cmykClient'
import type { CmykProfileInfo } from '../export/cmykClient'
import { cmykServerUrl } from '../export/cmykServerUrl'
import { approximate, CmykContext, NO_SERVER } from '../utils/cmykValues'
import type { CmykValues } from '../utils/cmykValues'

// Asks the server about a color this long after the palette stops changing, so dragging a picker
// sends one request
const DEBOUNCE_MS = 300

type CmykProviderProps = {
  hexes: string[] // the palette's colors (normalized HEX)
  children: ReactNode
}

// Keeps the profile values of the palette's colors for the session, so the form, the preview and
// the export show the same ones (read them with useCmyk). A failure leaves the values approximate,
// with no message (specs/colorpalette.md).
export function CmykProvider({ hexes, children }: CmykProviderProps) {
  const server = cmykServerUrl()
  const cache = useRef(new Map<string, Cmyk>())
  const [profile, setProfile] = useState<CmykProfileInfo | null>(null)
  const [version, setVersion] = useState(0) // a new answer re-renders whoever shows the values

  const ask = useCallback(
    async (wanted: string[]) => {
      const missing = [...new Set(wanted)].filter((hex) => !cache.current.has(hex))
      if (!server || missing.length === 0) return
      const answer = await fetchCmykColors(server, missing)
      for (const color of answer.colors) cache.current.set(color.hex, color.cmyk)
      setProfile(answer.profile)
      setVersion((n) => n + 1)
    },
    [server],
  )

  const key = hexes.join(',')
  useEffect(() => {
    if (!server || !key) return
    const timer = setTimeout(() => {
      ask(key.split(',')).catch(() => {}) // approximate until the server answers
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [key, server, ask])

  const value = useMemo<CmykValues>(
    () =>
      server
        ? {
            profile,
            valuesOf: (hex) => {
              const cmyk = cache.current.get(hex)
              return cmyk ? { cmyk, exact: true } : approximate(hex)
            },
            ready: ask,
          }
        : NO_SERVER,
    // `version` is how a new answer in the cache reaches the value
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [server, profile, ask, version],
  )

  return <CmykContext.Provider value={value}>{children}</CmykContext.Provider>
}
