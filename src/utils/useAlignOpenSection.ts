import { useLayoutEffect } from 'react'
import type { RefObject } from 'react'

// Two columns only above this width (see the @media rule in BrandManualPage.css)
const TWO_COLUMNS = '(min-width: 901px)'

// The open section moves to the top of the right column, and its page to the top of the
// preview. This pushes the sections down until the open one starts at the same height as
// that page, so the form and its page sit side by side. The offset is written to
// `--sections-offset` on `root` (used in BrandManualPage.css); it never pulls them up.
export function useAlignOpenSection(root: RefObject<HTMLElement | null>, active: boolean) {
  useLayoutEffect(() => {
    const element = root.current
    if (!element) return
    const reset = () => element.style.removeProperty('--sections-offset')

    const preview = element.querySelector('.manual-preview')
    const pages = element.querySelector('.manual-pages')
    const sectionColumn = element.querySelector('.manual-sections')
    const sections = element.querySelector('.manual-sections ol')
    const sideBySide = window.matchMedia?.(TWO_COLUMNS).matches ?? true
    if (!active || !preview || !pages || !sectionColumn || !sections || !sideBySide) {
      reset()
      return
    }

    // Each list is measured from the top of its own column. The preview is sticky: once the
    // page scrolls, it stays on screen while the sections go up, so comparing the two lists
    // on screen would add the scroll to the gap (and a resize then pushed everything far down).
    // Both columns start at the same height, and the list's top does not move with its own
    // padding, so there is no feedback loop.
    function align() {
      const top = (node: Element) => node.getBoundingClientRect().top
      const gap = top(pages!) - top(preview!) - (top(sections!) - top(sectionColumn!))
      element!.style.setProperty('--sections-offset', `${Math.max(0, Math.round(gap))}px`)
    }

    align()
    // The preview toolbar can wrap onto two rows when the window changes size: follow it.
    if (typeof ResizeObserver === 'undefined') return reset
    const observer = new ResizeObserver(align)
    observer.observe(element)
    return () => {
      observer.disconnect()
      reset()
    }
  }, [root, active])
}
