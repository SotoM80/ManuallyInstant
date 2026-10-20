import { measureSvg } from './measureSvg'
import { cropSvg, inReadingOrder, layerFileName, partLabel, readSvgLayers, sizedSvg } from './svgLayers'

// The parts a layered SVG gives a mark card (see specs/logolayers.md): one per layer, in
// reading order, each cropped to what it draws. `total` counts every layer, so the form can say
// when only some are used.
export type LogoLayers =
  | { kind: 'none' } // not an SVG, or fewer than 2 layers: the file is only the card's image
  | { kind: 'unreadable' }
  | { kind: 'layers'; parts: { label: string; file: File }[]; total: number }

const SVG_TYPE = 'image/svg+xml'

// Big enough for a crop precise to a fraction of a percent, small enough to scan fast
const SCAN_SIZE = 1024

function readText(file: File) {
  return new Promise<string>((done, fail) => {
    const reader = new FileReader()
    reader.onload = () => done(String(reader.result))
    reader.onerror = () => fail(reader.error)
    reader.readAsText(file)
  })
}

export async function logoLayers(file: File, max: number): Promise<LogoLayers> {
  if (file.type !== SVG_TYPE) return { kind: 'none' }
  let read
  try {
    read = readSvgLayers(await readText(file))
  } catch {
    return { kind: 'unreadable' }
  }
  if (!read) return { kind: 'unreadable' }
  if (read.layers.length < 2) return { kind: 'none' }

  const [, , width, height] = read.viewBox
  const scale = SCAN_SIZE / Math.max(width, height)
  const scanWidth = Math.max(1, Math.round(width * scale))
  const scanHeight = Math.max(1, Math.round(height * scale))
  const measured = await Promise.all(
    read.layers.map(async (layer) => ({ ...layer, bounds: await measureSvg(sizedSvg(layer.svg, scanWidth, scanHeight)) })),
  )

  const parts = inReadingOrder(measured)
    .slice(0, max)
    .map((layer, index) => {
      const svg = layer.bounds ? cropSvg(layer.svg, read.viewBox, layer.bounds) : layer.svg
      return {
        label: partLabel(layer.name),
        file: new File([svg], layerFileName(file.name, layer.name, index + 1), { type: SVG_TYPE }),
      }
    })
  return { kind: 'layers', parts, total: read.layers.length }
}
