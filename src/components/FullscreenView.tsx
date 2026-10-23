import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { createPortal } from 'react-dom'
import { PrintedPage } from './ExportPages'
import type { ManualData } from './ManualPage'
import { MANUAL_PAGES } from '../data/manualSections'
import { a4 } from '../export/exportSettings'
import type { TemplateId } from '../templates'
import type { Guides } from '../utils/guides'
import type { Orientation } from '../types'
import { fitScale } from '../utils/fullscreen'

// The whole manual at the size of the screen (see specs/fullscreen.md): every page, in natural
// order, drawn like the PDF at A4 size and scaled so each one fits whole on the viewer's screen.
// It covers the window; the browser's full screen is asked for by the button itself (see
// openFullscreen in utils/fullscreen.ts), since browsers only allow it during the click.
type FullscreenViewProps = ManualData & {
  orientation: Orientation
  template: TemplateId
  guides?: Guides
  onClose: () => void
  // Gets the focus back on closing. Named, not taken from the focus at opening: a click does not
  // focus a button everywhere (Safari on the Mac does not)
  returnFocus: RefObject<HTMLElement | null>
}

// The Exit button fades after this long without moving the mouse
const IDLE_MS = 3000

function viewSize() {
  return { width: window.innerWidth, height: window.innerHeight }
}

export function FullscreenView({ orientation, template, guides, onClose, returnFocus, ...data }: FullscreenViewProps) {
  const view = useRef<HTMLDivElement>(null)
  const exit = useRef<HTMLButtonElement>(null)
  const page = a4(orientation).px
  const [scale, setScale] = useState(() => fitScale(viewSize(), page))
  const [idle, setIdle] = useState(false)

  // Fit again whenever the window or the screen changes size
  useEffect(() => {
    const fit = () => setScale(fitScale(viewSize(), a4(orientation).px))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [orientation])

  // Opening: the focus on Exit, the rest of the page out of reach and still. Closing leaves the
  // browser's full screen and puts everything back.
  useEffect(() => {
    const element = view.current!
    const back = returnFocus.current // the button stays in the page while the view is open
    const host = element.parentElement!
    const others = Array.from(host.children).filter((child) => child !== element && !child.hasAttribute('inert'))
    others.forEach((child) => child.setAttribute('inert', ''))
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    exit.current?.focus()

    let entered = Boolean(document.fullscreenElement)
    // Leaving the browser's full screen, whatever the way (Esc is the browser's), closes the view
    function changed() {
      if (document.fullscreenElement) entered = true
      else if (entered) onClose()
    }
    // In the window fallback, Esc is ours
    function key(event: KeyboardEvent) {
      if (event.key === 'Escape' && !document.fullscreenElement) onClose()
    }
    document.addEventListener('fullscreenchange', changed)
    window.addEventListener('keydown', key)

    return () => {
      document.removeEventListener('fullscreenchange', changed)
      window.removeEventListener('keydown', key)
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
      others.forEach((child) => child.removeAttribute('inert'))
      document.body.style.overflow = overflow
      back?.focus()
    }
  }, [onClose, returnFocus])

  // The Exit button fades when the mouse rests, and comes back when it moves
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  function wake() {
    setIdle(false)
    clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => setIdle(true), IDLE_MS)
  }
  useEffect(() => {
    idleTimer.current = setTimeout(() => setIdle(true), IDLE_MS)
    return () => clearTimeout(idleTimer.current)
  }, [])

  const width = page.width * scale
  const height = page.height * scale
  return createPortal(
    // .manual-preview with the Pages view and the template, so the pages are laid out as in the PDF
    <div
      ref={view}
      className="manual-preview fullscreen-view"
      data-view="pages"
      data-template={template}
      data-idle={idle}
      role="dialog"
      aria-modal="true"
      aria-label="Full screen view"
      onMouseMove={wake}
    >
      <button ref={exit} type="button" className="fullscreen-exit" onClick={onClose}>
        Exit full screen
      </button>
      <ol className="fullscreen-pages">
        {MANUAL_PAGES.map((name, index) => (
          <li key={name} className="fullscreen-item">
            <div className="fullscreen-page" style={{ width, height }}>
              <div style={{ width: page.width, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                <PrintedPage page={name} orientation={orientation} guides={guides} {...data} />
              </div>
            </div>
            <span className="fullscreen-caption">
              {index + 1}. {name}
            </span>
          </li>
        ))}
      </ol>
    </div>,
    document.body,
  )
}
