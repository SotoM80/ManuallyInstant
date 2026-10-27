import { useEffect } from 'react'
import type { RefObject } from 'react'

// Fallback for the landing's scroll reveals (ADR 0017). Browsers with scroll-driven animations
// reveal `.reveal` elements in CSS alone; elsewhere each one is marked `data-reveal="pending"`
// (hidden by CSS) and becomes "shown" once it enters the screen.
// Without IntersectionObserver nothing is marked, so the content is simply visible.
export function useReveal(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.CSS?.supports?.('animation-timeline: view()')) return
    if (typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute('data-reveal', 'shown')
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    root.querySelectorAll('.reveal').forEach((element) => {
      element.setAttribute('data-reveal', 'pending')
      observer.observe(element)
    })
    return () => observer.disconnect()
  }, [rootRef])
}
