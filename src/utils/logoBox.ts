import type { VisibleBounds } from './visibleBounds'

// Where the logo goes in a drawing measured in modules: its visible part is `modules` wide,
// starts at (margin, top), and its height follows its own proportions. The whole image is
// placed so that its transparent margins fall outside that box. Shared by the clear space
// diagram (3.1) and the construction grid (3.2), so both draw the logo and X the same way.
export function logoBox(bounds: VisibleBounds, modules: number, margin: number, top = margin) {
  const visibleRatio = (bounds.width * bounds.ratio) / bounds.height
  const height = modules / visibleRatio
  const imageWidth = modules / bounds.width
  const imageHeight = imageWidth / bounds.ratio
  return {
    height, // of the visible logo, in modules
    image: {
      x: margin - bounds.x * imageWidth,
      y: top - bounds.y * imageHeight,
      width: imageWidth,
      height: imageHeight,
    },
  }
}
