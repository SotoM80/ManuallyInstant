import { emptyMask, maskToPixels, pixelsToMask } from './selection'
import type { Mask, Pixels } from './selection'

// What the template editor needs from a real canvas (see specs/mockups.md, The template editor):
// the photo's pixels, a template's mask as pixels, and a mask as an image. jsdom draws nothing,
// so tests mock this module; the selection itself is pure (selection.ts).

// The editor works on the photo at most this wide: fast enough for the magic wand, sharp enough
// for a mask that is softened and scaled to the mockup's size anyway
export const EDITOR_WIDTH = 1000

export type EditorPhoto = {
  pixels: Pixels
  size: [number, number] // the photo's own size
  scale: number // editor pixels per photo pixel
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((done, fail) => {
    const image = new Image()
    image.onload = () => done(image)
    image.onerror = () => fail(new Error(`Could not load ${url}`))
    image.src = url
  })
}

function context2d(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('No 2D canvas')
  return context
}

export async function loadEditorPhoto(url: string): Promise<EditorPhoto> {
  const image = await loadImage(url)
  const size: [number, number] = [image.naturalWidth, image.naturalHeight]
  const scale = Math.min(1, EDITOR_WIDTH / size[0])
  const width = Math.round(size[0] * scale)
  const height = Math.round(size[1] * scale)
  const context = context2d(width, height)
  context.drawImage(image, 0, 0, width, height)
  const { data } = context.getImageData(0, 0, width, height)
  return { pixels: { data, width, height }, size, scale }
}

// A template's current mask at the editor's size: its mask image, or its polygons filled
export async function loadEditorMask(
  mask: { polygons: [number, number][][]; image?: string },
  width: number,
  height: number,
  scale: number,
): Promise<Mask> {
  const context = context2d(width, height)
  if (mask.image) {
    context.drawImage(await loadImage(mask.image), 0, 0, width, height)
  } else if (mask.polygons.length > 0) {
    context.fillStyle = '#FFFFFF'
    context.beginPath()
    for (const polygon of mask.polygons) {
      polygon.forEach(([x, y], i) => (i === 0 ? context.moveTo(x * scale, y * scale) : context.lineTo(x * scale, y * scale)))
      context.closePath()
    }
    context.fill()
  } else {
    return emptyMask(width, height)
  }
  const { data } = context.getImageData(0, 0, width, height)
  return pixelsToMask({ data, width, height })
}

// The mask as a PNG (white where selected, transparent elsewhere), to keep in the template
export function maskToDataUrl(mask: Mask) {
  const context = context2d(mask.width, mask.height)
  const image = context.createImageData(mask.width, mask.height)
  image.data.set(maskToPixels(mask))
  context.putImageData(image, 0, 0)
  return context.canvas.toDataURL('image/png')
}

// Draws the photo with the selection over it, tinted, on the editor's canvas
export function drawSelection(canvas: HTMLCanvasElement, photo: EditorPhoto, mask: Mask, tint: [number, number, number]) {
  const { width, height } = photo.pixels
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return
  const shown = new Uint8ClampedArray(photo.pixels.data)
  for (let i = 0; i < mask.data.length; i++) {
    const amount = (mask.data[i] / 255) * 0.5
    if (amount === 0) continue
    for (let c = 0; c < 3; c++) shown[i * 4 + c] = shown[i * 4 + c] * (1 - amount) + tint[c] * amount
  }
  const image = context.createImageData(width, height)
  image.data.set(shown)
  context.putImageData(image, 0, 0)
}
