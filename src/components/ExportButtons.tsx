import { useEffect, useRef, useState } from 'react'
import { ExportPages } from './ExportPages'
import type { ManualData } from './ManualPage'
import { MANUAL_PAGES } from '../data/manualSections'
import { checkServer, CmykServerError } from '../export/cmykClient'
import { cmykServerUrl } from '../export/cmykServerUrl'
import { createCmykPdf, createPdf } from '../export/createPdf'
import { emptySections, pdfFileName, progressLabel } from '../export/exportSettings'
import { inlineSvgStyles } from '../export/inlineSvgStyles'
import { skinPicturesReady } from '../export/skinPictures'
import type { ExportKind, ExportStep } from '../export/exportSettings'
import { useCmyk } from '../utils/cmykValues'
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

// The PDF being made; `cmyk` sends the print one through the CMYK server (specs/export.md)
type Job = { kind: ExportKind; cmyk: boolean }

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
// the Skin's pictures read (or the export stops), images decoded, and every page done drawing
async function pagesReady(root: HTMLElement) {
  await document.fonts?.ready
  await mockupsDrawn(root)
  await skinPicturesReady(root)
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(images.map((image) => (typeof image.decode === 'function' ? image.decode().catch(() => {}) : null)))
  await settled(root)
}

// A server that cannot be reached, or stays busy, leads to the RGB offer; one that refuses a page
// is a real failure (specs/export.md)
function serverDown(error: unknown) {
  return error instanceof CmykServerError && error.kind !== 'rejected'
}

// The two download buttons next to Apply (see specs/export.md): a warning first when some
// sections are still empty, "Creating… n/10" (then "Converting to CMYK… n/10") while the PDF is
// made, a dialog when the CMYK server cannot be reached, and a message if it fails.
export function ExportButtons({ orientation, template, guides, ...data }: ExportButtonsProps) {
  const [warning, setWarning] = useState<{ kind: ExportKind; empty: string[] } | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [step, setStep] = useState<ExportStep>({ phase: 'drawing', done: 0 })
  const [failed, setFailed] = useState(false)
  const [offline, setOffline] = useState(false) // the CMYK server did not answer
  const copy = useRef<HTMLElement>(null)
  const cmyk = useCmyk()
  const server = cmykServerUrl()

  function ask(kind: ExportKind) {
    setFailed(false)
    setOffline(false)
    const empty = emptySections(data)
    if (empty.length > 0) setWarning({ kind, empty })
    else start(kind)
  }

  // Only the print PDF goes through the CMYK server, and only when the app has one
  function start(kind: ExportKind, useServer = kind === 'print' && server !== null) {
    setWarning(null)
    setOffline(false)
    setStep({ phase: 'drawing', done: 0 })
    setJob({ kind, cmyk: useServer })
  }

  // Once the copy of the pages is in the page, draw them and download the PDF
  useEffect(() => {
    if (!job || !copy.current) return
    const root = copy.current
    let cancelled = false
    ;(async () => {
      try {
        if (job.cmyk && server) {
          // Before drawing anything: is the server there, and are the palette's values on the page?
          await checkServer(server)
          await cmyk.ready((data.palette ?? []).map((color) => color.hex))
        }
        await pagesReady(root)
        if (cancelled) return
        inlineSvgStyles(root) // the construction grid and the clear space are styled by CSS
        const pages = Array.from(root.querySelectorAll<HTMLElement>('article.manual-page'))
        const fileName = pdfFileName(data.cover?.title, job.kind)
        if (job.cmyk && server) {
          await createCmykPdf(pages, orientation, fileName, server, setStep)
        } else {
          await createPdf(pages, job.kind, orientation, fileName, (done) => setStep({ phase: 'drawing', done }))
        }
      } catch (error) {
        if (cancelled) return
        if (serverDown(error)) setOffline(true)
        else setFailed(true)
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
          {job?.kind === button.kind ? progressLabel(step, MANUAL_PAGES.length) : button.label}
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
      {offline && (
        <div className="export-message" role="alertdialog" aria-label="CMYK server unavailable">
          <p>The CMYK server cannot be reached, so the print PDF cannot be made in CMYK. Download it in RGB instead?</p>
          <button type="button" className="palette-secondary-button" onClick={() => start('print', false)}>
            Download RGB PDF
          </button>
          <button type="button" className="palette-secondary-button" onClick={() => setOffline(false)}>
            Cancel
          </button>
        </div>
      )}
      {failed && (
        <p className="export-message" role="alert">
          The PDF could not be created. Try again.
        </p>
      )}

      {job && <ExportPages ref={copy} kind={job.kind} orientation={orientation} template={template} guides={guides} {...data} />}
    </div>
  )
}
