import { useEffect, useState } from 'react'

// Where the drawing of an image really is, ignoring its transparent margins.
// x, y, width and height are fractions of the image (0 to 1); `ratio` is width / height of
// the whole image. The construction grid is fitted to this box (see ConstructionGrid).
export type VisibleBounds = { x: number; y: number; width: number; height: number; ratio: number }

// The whole image, square: used until the real image has been read (and in tests)
export const FULL_BOUNDS: VisibleBounds = { x: 0, y: 0, width: 1, height: 1, ratio: 1 }

// A pixel counts as drawn above this alpha (0–255), so soft anti-aliased edges are ignored
const ALPHA_THRESHOLD = 16

// Scans RGBA pixels for the first and last drawn row and column. An image with no
// transparent margin (a JPG, or a logo on a coloured square) gives the whole image.
export function findVisibleBounds(pixels: Uint8ClampedArray, width: number, height: number): VisibleBounds {
  let left = width
  let right = -1
  let top = height
  let bottom = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * 4 + 3] <= ALPHA_THRESHOLD) continue
      if (x < left) left = x
      if (x > right) right = x
      if (y < top) top = y
      if (y > bottom) bottom = y
    }
  }
  const ratio = width / height
  if (right < 0) return { ...FULL_BOUNDS, ratio } // fully transparent: nothing to fit
  return {
    x: left / width,
    y: top / height,
    width: (right - left + 1) / width,
    height: (bottom - top + 1) / height,
    ratio,
  }
}

// Small enough to scan fast, big enough for a precise box
const SCAN_SIZE = 256

// Reads an image (an object URL of the user's file, same origin, so its pixels can be read)
// and returns its visible bounds. Until it has loaded, or if the browser cannot draw it,
// the whole image is used.
export function useVisibleBounds(url: string | null) {
  const [result, setResult] = useState<{ url: string; bounds: VisibleBounds } | null>(null)

  useEffect(() => {
    if (!url) return
    let cancelled = false
    const image = new Image()
    image.onload = () => {
      if (cancelled || !image.naturalWidth || !image.naturalHeight) return
      const scale = Math.min(1, SCAN_SIZE / Math.max(image.naturalWidth, image.naturalHeight))
      const width = Math.max(1, Math.round(image.naturalWidth * scale))
      const height = Math.max(1, Math.round(image.naturalHeight * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) return
      context.drawImage(image, 0, 0, width, height)
      const pixels = context.getImageData(0, 0, width, height).data
      setResult({ url, bounds: findVisibleBounds(pixels, width, height) })
    }
    image.src = url
    return () => {
      cancelled = true
    }
  }, [url])

  // A result for another image is stale: use the whole image until the new one is read
  return result && result.url === url ? result.bounds : FULL_BOUNDS
}
