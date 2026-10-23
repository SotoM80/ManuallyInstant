import { forwardRef } from 'react'
import { MANUAL_PAGES } from '../data/manualSections'
import { ManualPage } from './ManualPage'
import type { ManualData } from './ManualPage'
import { a4 } from '../export/exportSettings'
import type { ExportKind } from '../export/exportSettings'
import type { TemplateId } from '../templates'
import type { Guides } from '../utils/guides'
import type { Orientation } from '../types'

type ExportPagesProps = ManualData & {
  kind: ExportKind
  orientation: Orientation
  template: TemplateId
  guides?: Guides
}

// An off-screen copy of every page, in natural order, laid out like the Pages view at A4 size
// and with no motion, to be drawn into the PDF (see specs/export.md). Mounted only while a PDF
// is made; hidden from screen readers and the keyboard.
export const ExportPages = forwardRef<HTMLElement, ExportPagesProps>(function ExportPages(
  { kind, orientation, template, guides, ...data },
  ref,
) {
  const { px } = a4(orientation)
  return (
    <section
      ref={ref}
      className="manual-preview manual-export"
      data-view="pages"
      data-template={template}
      aria-hidden="true"
      inert
      style={{ width: px.width }}
    >
      <ol className="manual-pages">
        {MANUAL_PAGES.map((page) => (
          <li key={page}>
            <PrintedPage page={page} orientation={orientation} guides={guides} emphasis={kind} {...data} />
          </li>
        ))}
      </ol>
    </section>
  )
})

type PrintedPageProps = ManualData & {
  page: string
  orientation: Orientation
  guides?: Guides
  emphasis?: ExportKind
}

// A page as the PDF draws it: inside a parent laid out like the Pages view at A4 size, with the
// title at its real size, and the guides drawn but not clickable (no onGuidesChange). Shared by
// the PDF copy and the full screen view (specs/fullscreen.md), so both show the same page.
export function PrintedPage({ page, orientation, guides, emphasis, ...data }: PrintedPageProps) {
  return <ManualPage page={page} orientation={orientation} titleScale={1} guides={guides} emphasis={emphasis} {...data} />
}
