import { flushSync } from 'react-dom'

// Runs a state update inside a View Transition, so the browser animates the page
// from how it looked before to how it looks after (pieces glide to their new spot).
// Without the API (older browsers, jsdom) or with reduced motion, the update just runs.
export function withViewTransition(update: () => void) {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reduceMotion) {
    update()
    return
  }
  // flushSync makes React draw the new state right away, inside the transition.
  document.startViewTransition(() => flushSync(update))
}
