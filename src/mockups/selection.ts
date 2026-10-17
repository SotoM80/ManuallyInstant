// Selecting the product in a photo, for the template editor (see specs/mockups.md, The template
// editor). A selection is a mask: one byte per pixel, 0 (not the product) to 255 (the product).
// Pure functions on plain pixels, so they are unit tested without a canvas.

// Pixels as a canvas gives them (RGBA, row by row)
export type Pixels = { data: Uint8ClampedArray; width: number; height: number }
export type Mask = { data: Uint8ClampedArray; width: number; height: number }

export function emptyMask(width: number, height: number): Mask {
  return { data: new Uint8ClampedArray(width * height), width, height }
}

// The largest distance between two colors (black to white), to turn a tolerance into a distance
const MAX_DISTANCE = Math.sqrt(3 * 255 * 255)

// The magic wand: every pixel connected to the clicked one (up, down, left, right) whose color is
// within `tolerance` (0–100 %) of the clicked pixel's color
export function magicWand(pixels: Pixels, x: number, y: number, tolerance: number): Mask {
  const { width, height, data } = pixels
  const mask = emptyMask(width, height)
  const startX = Math.round(x)
  const startY = Math.round(y)
  if (startX < 0 || startY < 0 || startX >= width || startY >= height) return mask

  const seed = (startY * width + startX) * 4
  const [r, g, b] = [data[seed], data[seed + 1], data[seed + 2]]
  const limit = ((tolerance / 100) * MAX_DISTANCE) ** 2
  const close = (i: number) => {
    const dr = data[i * 4] - r
    const dg = data[i * 4 + 1] - g
    const db = data[i * 4 + 2] - b
    return dr * dr + dg * dg + db * db <= limit
  }

  // A stack instead of recursion: a product can be a million pixels
  const stack = [startY * width + startX]
  while (stack.length > 0) {
    const i = stack.pop()!
    if (mask.data[i] || !close(i)) continue
    mask.data[i] = 255
    const px = i % width
    if (px > 0) stack.push(i - 1)
    if (px < width - 1) stack.push(i + 1)
    if (i >= width) stack.push(i - width)
    if (i < width * (height - 1)) stack.push(i + width)
  }
  return mask
}

// A new selection replaces the old one, or adds to it, or takes away from it
export type SelectMode = 'replace' | 'add' | 'subtract'

export function combineMasks(current: Mask, next: Mask, mode: SelectMode): Mask {
  if (mode === 'replace') return next
  const data = new Uint8ClampedArray(current.data)
  for (let i = 0; i < data.length; i++) {
    data[i] = mode === 'add' ? Math.max(data[i], next.data[i]) : Math.min(data[i], 255 - next.data[i])
  }
  return { ...current, data }
}

// The brush: a round stroke between two points, adding to the selection or erasing from it
export function brush(mask: Mask, from: [number, number], to: [number, number], radius: number, erase: boolean): Mask {
  const data = new Uint8ClampedArray(mask.data)
  const value = erase ? 0 : 255
  const length = Math.hypot(to[0] - from[0], to[1] - from[1])
  const steps = Math.max(1, Math.ceil(length / Math.max(1, radius / 2)))
  for (let s = 0; s <= steps; s++) {
    const cx = from[0] + ((to[0] - from[0]) * s) / steps
    const cy = from[1] + ((to[1] - from[1]) * s) / steps
    for (let y = Math.max(0, Math.floor(cy - radius)); y <= Math.min(mask.height - 1, Math.ceil(cy + radius)); y++) {
      for (let x = Math.max(0, Math.floor(cx - radius)); x <= Math.min(mask.width - 1, Math.ceil(cx + radius)); x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= radius * radius) data[y * mask.width + x] = value
      }
    }
  }
  return { ...mask, data }
}

// Softens the edge of a selection (a box blur, twice, across then down), so the tinted product
// does not end in a hard, jagged line
export function softenMask(mask: Mask, radius: number): Mask {
  if (radius <= 0) return mask
  const { width, height } = mask
  const pass = (source: Uint8ClampedArray, across: boolean) => {
    const out = new Uint8ClampedArray(source.length)
    const lines = across ? height : width
    const length = across ? width : height
    for (let line = 0; line < lines; line++) {
      const at = (k: number) => (across ? line * width + k : k * width + line)
      let sum = 0
      let count = 0
      for (let k = 0; k <= Math.min(radius, length - 1); k++) {
        sum += source[at(k)]
        count++
      }
      for (let k = 0; k < length; k++) {
        out[at(k)] = Math.round(sum / count)
        const enter = k + radius + 1
        const leave = k - radius
        if (enter < length) {
          sum += source[at(enter)]
          count++
        }
        if (leave >= 0) {
          sum -= source[at(leave)]
          count--
        }
      }
    }
    return out
  }
  return { ...mask, data: pass(pass(mask.data, true), false) }
}

// How much of the photo is selected (0–1), to show the user and to refuse an empty selection
export function selectedShare(mask: Mask) {
  let selected = 0
  for (const value of mask.data) if (value >= 128) selected++
  return selected / (mask.data.length || 1)
}

// The mask as RGBA pixels (white where selected, transparent elsewhere), to draw it on a canvas
export function maskToPixels(mask: Mask): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(mask.width * mask.height * 4)
  for (let i = 0; i < mask.data.length; i++) {
    rgba[i * 4] = 255
    rgba[i * 4 + 1] = 255
    rgba[i * 4 + 2] = 255
    rgba[i * 4 + 3] = mask.data[i]
  }
  return rgba
}

// And back: a mask from the alpha (or the red, for an opaque image) of RGBA pixels
export function pixelsToMask(pixels: Pixels): Mask {
  const mask = emptyMask(pixels.width, pixels.height)
  let opaque = true
  for (let i = 3; i < pixels.data.length; i += 4) if (pixels.data[i] < 255) opaque = false
  for (let i = 0; i < mask.data.length; i++) mask.data[i] = opaque ? pixels.data[i * 4] : pixels.data[i * 4 + 3]
  return mask
}
