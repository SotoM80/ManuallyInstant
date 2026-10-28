import { a4, CSS_DPI, EXPORT_SETTINGS } from './exportSettings'
import type { ExportKind, ExportStep } from './exportSettings'
import { convertPage } from './cmykClient'
import type { CmykPage } from './cmykClient'
import type { Orientation } from '../types'

// What every page is drawn with: html-to-image, the kind's resolution and the fonts, fetched once
// and embedded in every page (ADR 0012)
async function pageDrawing(pages: HTMLElement[], kind: ExportKind) {
  const htmlToImage = await import('html-to-image')
  const settings = EXPORT_SETTINGS[kind]
  const fontEmbedCSS = pages[0] ? await htmlToImage.getFontEmbedCSS(pages[0]) : undefined
  const options = { pixelRatio: settings.dpi / CSS_DPI, quality: settings.quality, fontEmbedCSS, cacheBust: false }
  return { htmlToImage, settings, options }
}

// Draws every page element as an image and puts one per A4 page in a PDF, then downloads it
// (see specs/export.md and ADR 0012). The libraries are loaded here, only when a PDF is made.
export async function createPdf(
  pages: HTMLElement[],
  kind: ExportKind,
  orientation: Orientation,
  fileName: string,
  onProgress?: (done: number) => void,
) {
  const [{ htmlToImage, settings, options }, { jsPDF }] = await Promise.all([pageDrawing(pages, kind), import('jspdf')])
  const { mm } = a4(orientation)
  const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4', compress: true })

  for (const [index, page] of pages.entries()) {
    onProgress?.(index + 1)
    const image = settings.image === 'png' ? await htmlToImage.toPng(page, options) : await htmlToImage.toJpeg(page, options)
    if (index > 0) pdf.addPage('a4', orientation)
    pdf.addImage(image, settings.image === 'png' ? 'PNG' : 'JPEG', 0, 0, mm.width, mm.height, undefined, 'FAST')
  }
  pdf.save(fileName)
}

// The print PDF in real CMYK (specs/export.md, ADR 0019): every page is drawn as for the print
// PDF, then sent to the CMYK server one at a time, then placed as a DeviceCMYK image. Throws a
// CmykServerError if the server fails, so the PDF is never half CMYK and half RGB.
export async function createCmykPdf(
  pages: HTMLElement[],
  orientation: Orientation,
  fileName: string,
  server: string,
  onStep?: (step: ExportStep) => void,
) {
  const { htmlToImage, options } = await pageDrawing(pages, 'print')
  const images: Blob[] = []
  for (const [index, page] of pages.entries()) {
    onStep?.({ phase: 'drawing', done: index + 1 })
    const image = await htmlToImage.toBlob(page, options)
    if (!image) throw new Error('A page could not be drawn')
    images.push(image)
  }

  const cmykPages: CmykPage[] = []
  for (const [index, image] of images.entries()) {
    onStep?.({ phase: 'converting', done: index + 1 })
    cmykPages.push(await convertPage(server, image))
  }

  // pdf-lib's bytes are never shared memory, which is all a Blob refuses
  const bytes = (await cmykPdfBytes(cmykPages, orientation)) as Uint8Array<ArrayBuffer>
  downloadBlob(new Blob([bytes], { type: 'application/pdf' }), fileName)
}

// A4 pages, each one filled by its CMYK image. The server's bytes are already zlib-compressed,
// which is what a PDF calls FlateDecode, so they go in as they are. pdf-lib is loaded only here.
export async function cmykPdfBytes(pages: CmykPage[], orientation: Orientation) {
  const lib = await import('pdf-lib')
  const pdf = await lib.PDFDocument.create()
  const { mm } = a4(orientation)
  const [width, height] = [mm.width, mm.height].map((value) => (value / 25.4) * 72) // in points

  for (const cmyk of pages) {
    const image = pdf.context.register(
      pdf.context.stream(cmyk.bytes, {
        Type: 'XObject',
        Subtype: 'Image',
        Width: cmyk.width,
        Height: cmyk.height,
        ColorSpace: 'DeviceCMYK',
        BitsPerComponent: 8,
        Filter: 'FlateDecode',
      }),
    )
    const page = pdf.addPage([width, height])
    const name = page.node.newXObject('Page', image)
    page.pushOperators(
      lib.pushGraphicsState(),
      lib.concatTransformationMatrix(width, 0, 0, height, 0, 0), // the image fills the page
      lib.drawObject(name),
      lib.popGraphicsState(),
    )
  }
  return pdf.save()
}

// Saves a file made in the browser, as jsPDF's save() does
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
