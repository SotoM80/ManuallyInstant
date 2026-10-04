// Regular, bold, italic and bold italic: every variant Font Style can pick.
// The app sets `font-synthesis: none`, so a variant that is not downloaded is never drawn.
const VARIANTS = 'ital,wght@0,400;0,700;1,400;1,700'

export function googleFontHref(family: string) {
  return `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:${VARIANTS}&display=swap`
}

// Adds the font's stylesheet to <head> once; later calls for the same font do nothing.
export function loadGoogleFont(family: string) {
  const href = googleFontHref(family)
  if (document.head.querySelector(`link[href="${href}"]`)) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}
