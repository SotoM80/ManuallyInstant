// The two PDFs of the manual (see specs/export.md and ADR 0012)
export type ExportKind = 'print' | 'web'

// A page is laid out at its A4 size in CSS pixels (96 per inch); `dpi` sets how much bigger
// it is drawn, so the image keeps its detail when printed.
export const CSS_DPI = 96

export const EXPORT_SETTINGS: Record<ExportKind, { dpi: number; image: 'png' | 'jpeg'; quality: number }> = {
  print: { dpi: 300, image: 'png', quality: 1 },
  web: { dpi: 144, image: 'jpeg', quality: 0.82 },
}

// Where a PDF is: drawing its pages, or sending them to the CMYK server (specs/export.md)
export type ExportStep = { phase: 'drawing' | 'converting'; done: number }

// { phase: 'converting', done: 3 }, 10 → "Converting to CMYK… 3/10"
export function progressLabel({ phase, done }: ExportStep, total: number) {
  return `${phase === 'drawing' ? 'Creating…' : 'Converting to CMYK…'} ${done}/${total}`
}

// A4 in mm and in CSS pixels, standing or lying down
export function a4(orientation: 'portrait' | 'landscape') {
  const mm = orientation === 'landscape' ? { width: 297, height: 210 } : { width: 210, height: 297 }
  const px = (value: number) => Math.round((value / 25.4) * CSS_DPI)
  return { mm, px: { width: px(mm.width), height: px(mm.height) } }
}

// "My Brand!" → "my-brand-print.pdf"; with no title, "brand-manual-print.pdf"
export function pdfFileName(title: string | undefined, kind: ExportKind) {
  const slug = (title ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || 'brand-manual'}-${kind}.pdf`
}

// The sections never touched, whose pages still show their placeholders. Usage counts while
// either of its two pages does, since each one waits for its own group (see specs/usage.md).
export function emptySections(data: {
  cover: unknown
  logo: unknown
  usage: { correct: unknown; incorrect: unknown }
  palette: unknown
  typography: unknown
}) {
  return [
    ['Cover', data.cover],
    ['Logo', data.logo],
    ['Usage', data.usage.correct === null || data.usage.incorrect === null ? null : data.usage],
    ['Colors', data.palette],
    ['Typography', data.typography],
  ]
    .filter(([, value]) => value === null)
    .map(([name]) => name as string)
}
