// Keeps an element at the same spot on screen while the page around it changes size.
// Used by the accordions: when a section above the clicked one folds, the page gets shorter
// and the clicked title would slide up out of view. Each frame, the page scrolls by exactly
// what the element moved, so it follows the CSS fold animation and the title stays still.
// If the user scrolls on their own meanwhile, it stops so it never fights them.
const USER_SCROLL_EVENTS = ['wheel', 'touchstart', 'keydown'] as const

export function keepInPlace(element: HTMLElement, duration = 600) {
  const startTop = element.getBoundingClientRect().top
  const start = performance.now()
  let frame = 0

  function stop() {
    cancelAnimationFrame(frame)
    USER_SCROLL_EVENTS.forEach((type) => window.removeEventListener(type, stop))
  }

  function follow(now: number) {
    const delta = element.getBoundingClientRect().top - startTop
    if (delta !== 0) window.scrollBy({ top: delta, behavior: 'instant' })
    if (now - start < duration) frame = requestAnimationFrame(follow)
    else stop()
  }

  USER_SCROLL_EVENTS.forEach((type) => window.addEventListener(type, stop, { passive: true }))
  frame = requestAnimationFrame(follow)
}
