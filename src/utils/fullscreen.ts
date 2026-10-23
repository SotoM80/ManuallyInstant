// Fitting the full screen view to the viewer's screen (see specs/fullscreen.md)

// Around the pages, and between them
const MARGIN = 24
// The caption under each page: its line (20px) and the gap above it (8px)
const CAPTION = 28

// The scale that fits a whole page and its caption in the visible area
export function fitScale(view: { width: number; height: number }, page: { width: number; height: number }) {
  const byWidth = (view.width - 2 * MARGIN) / page.width
  const byHeight = (view.height - 2 * MARGIN - CAPTION) / page.height
  return Math.max(0.05, Math.min(byWidth, byHeight))
}

// Asks for the browser's full screen during the click that opens the view: asked later (once the
// view is mounted, or twice in React's development mode), it is refused. Refused or not available,
// the view simply fills the window.
export function openFullscreen() {
  document.documentElement.requestFullscreen?.().catch(() => {})
}
