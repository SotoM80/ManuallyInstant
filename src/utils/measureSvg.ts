import { findVisibleBounds } from './visibleBounds'
import type { VisibleBounds } from './visibleBounds'

// Where an SVG is really drawn (fractions of its canvas), found by drawing it as an image on a
// canvas and reading its visible pixels, as the construction grid does (ADR 0008). Drawn as an
// image, nothing in the file can run (ADR 0015). The SVG must have its width and height set
// (see sizedSvg). null → the browser could not draw it. jsdom cannot draw: tests mock this.
export function measureSvg(svg: string, timeout = 4000): Promise<VisibleBounds | null> {
  return new Promise((done) => {
    const image = new Image()
    const timer = setTimeout(() => done(null), timeout)
    const finish = (bounds: VisibleBounds | null) => {
      clearTimeout(timer)
      done(bounds)
    }
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, image.naturalWidth)
      canvas.height = Math.max(1, image.naturalHeight)
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) return finish(null)
      try {
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        finish(findVisibleBounds(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height))
      } catch {
        finish(null) // a browser that will not let its pixels be read: the layer stays uncropped
      }
    }
    image.onerror = () => finish(null)
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  })
}
