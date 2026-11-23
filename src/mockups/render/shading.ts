// The mean brightness of the photo under the logo, so a Solid logo is shaded only by what is
// darker than the product around it (its folds and shadows), not by the product's own color: a
// white logo stays white on a black t-shirt, and still darkens in its folds.

// Pixels as a 2D canvas gives them: RGBA, 0–255, row after row
type Pixels = { data: Uint8ClampedArray }

// The darkest mean used: below it, the noise of a black photo would count as deep folds
const MIN_MEAN = 0.04

// Weighted by the photo's opacity (a transparent part is not the product) and, when the mask
// covers any of these pixels, by the mask too (the table around a card is not the product). With
// nothing to weigh, `fallback`.
export function meanBrightness(photo: Pixels, mask: Pixels | null, fallback: number) {
  const masked = mask !== null && mask.data.some((value, i) => i % 4 === 3 && value > 0)
  let sum = 0
  let weights = 0
  for (let i = 0; i < photo.data.length; i += 4) {
    const opacity = photo.data[i + 3] / 255
    const product = masked ? (mask.data[i + 3] / 255) * (mask.data[i] / 255) : 1
    const weight = opacity * product
    if (weight === 0) continue
    const brightness = (0.299 * photo.data[i] + 0.587 * photo.data[i + 1] + 0.114 * photo.data[i + 2]) / 255
    sum += brightness * weight
    weights += weight
  }
  return weights === 0 ? fallback : Math.max(MIN_MEAN, sum / weights)
}

// The box (in the image's pixels) that holds every point of the logo's mesh, inside the image
export function meshBox(positions: Float32Array, toImage: number, width: number, height: number) {
  let [left, top, right, bottom] = [Infinity, Infinity, -Infinity, -Infinity]
  for (let i = 0; i < positions.length; i += 2) {
    left = Math.min(left, positions[i])
    right = Math.max(right, positions[i])
    top = Math.min(top, positions[i + 1])
    bottom = Math.max(bottom, positions[i + 1])
  }
  const x = Math.max(0, Math.floor(left * toImage))
  const y = Math.max(0, Math.floor(top * toImage))
  const x2 = Math.min(width, Math.ceil(right * toImage))
  const y2 = Math.min(height, Math.ceil(bottom * toImage))
  return { x, y, width: Math.max(1, x2 - x), height: Math.max(1, y2 - y) }
}
