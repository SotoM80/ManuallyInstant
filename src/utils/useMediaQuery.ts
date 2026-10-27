import { useSyncExternalStore } from 'react'

// True while the CSS media query matches; follows changes (resizing, turning a tablet).
// False where matchMedia is missing (jsdom, used by the tests, has none).
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia?.(query)
      list?.addEventListener?.('change', onChange)
      return () => list?.removeEventListener?.('change', onChange)
    },
    () => window.matchMedia?.(query).matches ?? false,
  )
}
