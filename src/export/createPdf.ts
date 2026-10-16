import { a4, CSS_DPI, EXPORT_SETTINGS } from './exportSettings'
import type { ExportKind } from './exportSettings'

// Draws every page element as an image and puts one per A4 page in a PDF, then downloads it
// (see specs/export.md and ADR 0012). The libraries are loaded here, only when a PDF is made.
export async function createPdf(
  pages: HTMLElement[],
  kind: ExportKind,
  orientation: 'portrait' | 'landscape',
  fileName: string,
  onProgress?: (done: number) => void,
) {
  const [{ toJpeg, toPng, getFontEmbedCSS }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')])
  const settings = EXPORT_SETTINGS[kind]
  const { mm } = a4(orientation)
  const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4', compress: true })
  // The fonts are fetched once and embedded in every page
  const fontEmbedCSS = pages[0] ? await getFontEmbedCSS(pages[0]) : undefined
  const options = { pixelRatio: settings.dpi / CSS_DPI, quality: settings.quality, fontEmbedCSS, cacheBust: false }

  for (const [index, page] of pages.entries()) {
    onProgress?.(index + 1)
    const image = settings.image === 'png' ? await toPng(page, options) : await toJpeg(page, options)
    if (index > 0) pdf.addPage('a4', orientation)
    pdf.addImage(image, settings.image === 'png' ? 'PNG' : 'JPEG', 0, 0, mm.width, mm.height, undefined, 'FAST')
  }
  pdf.save(fileName)
}
