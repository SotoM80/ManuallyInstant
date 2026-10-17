import { useEffect, useRef, useState } from 'react'
import { ExportPages } from './ExportPages'
import type { ManualData } from './ManualPage'
import { MANUAL_PAGES } from '../data/manualSections'
import { createPdf } from '../export/createPdf'
import { emptySections, pdfFileName } from '../export/exportSettings'
import { inlineSvgStyles } from '../export/inlineSvgStyles'
import type { ExportKind } from '../export/exportSettings'
import type { TemplateId } from '../templates'
import type { Guides } from '../utils/guides'
import type { Orientation } from '../types'

type ExportButtonsProps = ManualData & {
  orientation: Orientation
  template: TemplateId
  guides?: Guides
}

const BUTTONS: { kind: ExportKind; label: string; name: string }[] = [
  { kind: 'print', label: '↓ Print PDF', name: 'Download print PDF' },
  { kind: 'web', label: '↓ Web PDF', name: 'Download web PDF' },
]

// How long the copy must stay unchanged to count as drawn, and the longest wait for it
const SETTLED_MS = 300
const MAX_WAIT_MS = 4000

// Resolves once nothing in `root` has changed for SETTLED_MS (or after MAX_WAIT_MS). Some pages
// draw themselves again after a while: the construction grid reads the logo's pixels in the
// background, then redraws with the logo's real edges.
function settled(root: HTMLElement) {
  return new Promise<void>((done) => {
    let quiet = setTimeout(finish, SETTLED_MS)
    const limit = setTimeout(finish, MAX_WAIT_MS)
    const observer = new MutationObserver(() => {
      clearTimeout(quiet)
      quiet = setTimeout(finish, SETTLED_MS)
    })
    observer.observe(root, { subtree: true, childList: true, attributes: true, characterData: true })
    function finish() {
      observer.disconnect()
      clearTimeout(quiet)
      clearTimeout(limit)
      done()
    }
  })
}

// Resolves once no photo mockup in `root` is still being composed (they mark themselves with
// data-rendering, see PhotoMockup), or after MAX_RENDER_MS
const MAX_RENDER_MS = 15000
function mockupsDrawn(root: HTMLElement) {
  return new Promise<void>((done) => {
    const busy = () => root.querySelector('[data-rendering]') !== null
    if (!busy()) return done()
    const limit = setTimeout(finish, MAX_RENDER_MS)
    const observer = new MutationObserver(() => {
      if (!busy()) finish()
    })
    observer.observe(root, { subtree: true, childList: true, attributes: true })
    function finish() {
      observer.disconnect()
      clearTimeout(limit)
      done()
    }
  })
}

// Waits until the copied pages are ready to be drawn: fonts loaded, photo mockups composed,
// images decoded, and every page done drawing itself
async function pagesReady(root: HTMLElement) {
  await document.fonts?.ready
  await mockupsDrawn(root)
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(images.map((image) => (typeof image.decode === 'function' ? image.decode().catch(() => {}) : null)))
  await settled(root)
}

// The two download buttons next to Apply (see specs/export.md): a warning first when some
// sections are still empty, "Creating… n/7" while the PDF is made, and a message if it fails.
export function ExportButtons({ orientation, template, guides, ...data }: ExportButtonsProps) {
  const [warning, setWarning] = useState<{ kind: ExportKind; empty: string[] } | null>(null)
  const [job, setJob] = useState<ExportKind | null>(null) // the PDF being made
  const [progress, setProgress] = useState(0)
  const [failed, setFailed] = useState(false)
  const copy = useRef<HTMLElement>(null)

  function ask(kind: ExportKind) {
    setFailed(false)
    const empty = emptySections(data)
    if (empty.length > 0) setWarning({ kind, empty })
    else start(kind)
  }

  function start(kind: ExportKind) {
    setWarning(null)
    setProgress(0)
    setJob(kind)
  }

  // Once the copy of the pages is in the page, draw them and download the PDF
  useEffect(() => {
    if (!job || !copy.current) return
    const root = copy.current
    let cancelled = false
    ;(async () => {
      try {
        await pagesReady(root)
        if (cancelled) return
        inlineSvgStyles(root) // the construction grid and the clear space are styled by CSS
        const pages = Array.from(root.querySelectorAll<HTMLElement>('article.manual-page'))
        await createPdf(pages, job, orientation, pdfFileName(data.cover?.title, job), setProgress)
      } catch {
        if (!cancelled) setFailed(true)
      } finally {
        if (!cancelled) setJob(null)
      }
    })()
    return () => {
      cancelled = true
    }
    // Only a new job starts a PDF; the manual cannot change while one is made
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job])

  return (
    <div className="export-buttons">
      {BUTTONS.map((button) => (
        <button
          key={button.kind}
          type="button"
          className="sections-export"
          aria-label={button.name}
          disabled={job !== null}
          onClick={() => ask(button.kind)}
        >
          {job === button.kind ? `Creating… ${progress}/${MANUAL_PAGES.length}` : button.label}
        </button>
      ))}

      {warning && (
        <div className="export-message" role="alertdialog" aria-label="Empty pages">
          <p>Some pages are still empty: {warning.empty.join(', ')}.</p>
          <button type="button" className="palette-secondary-button" onClick={() => start(warning.kind)}>
            Download anyway
          </button>
          <button type="button" className="palette-secondary-button" onClick={() => setWarning(null)}>
            Cancel
          </button>
        </div>
      )}
      {failed && (
        <p className="export-message" role="alert">
          The PDF could not be created. Try again.
        </p>
      )}

      {job && <ExportPages ref={copy} kind={job} orientation={orientation} template={template} guides={guides} {...data} />}
    </div>
  )
}
