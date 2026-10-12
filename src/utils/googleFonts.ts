// Regular, bold, italic and bold italic: every variant Font Style can pick.
// The app sets `font-synthesis: none`, so a variant that is not downloaded is never drawn.
const ALL_VARIANTS = 'ital,wght@0,400;0,700;1,400;1,700'

// 'all' for the Cover title (it can be bold or italic). 'regular' for the brand fonts:
// some of them have no bold or italic, and Google fails if it is asked for one that is missing.
export type FontVariants = 'all' | 'regular'

function familyParam(family: string) {
  return family.replace(/ /g, '+')
}

export function googleFontHref(family: string, variants: FontVariants = 'all') {
  const axes = variants === 'all' ? `:${ALL_VARIANTS}` : ''
  return `https://fonts.googleapis.com/css2?family=${familyParam(family)}${axes}&display=swap`
}

function addStylesheet(href: string) {
  if (document.head.querySelector(`link[href="${href}"]`)) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

// Adds the font's stylesheet to <head> once; later calls for the same font do nothing.
export function loadGoogleFont(family: string, variants: FontVariants = 'all') {
  addStylesheet(googleFontHref(family, variants))
}

// One stylesheet for every family, with `text=` set to only the letters of their names:
// enough to draw each name in its own font (e.g. in a list of options), a few KB in total.
export function fontPreviewHref(families: readonly string[]) {
  const letters = [...new Set(families.join(''))].sort().join('')
  const params = families.map((family) => `family=${familyParam(family)}`).join('&')
  return `https://fonts.googleapis.com/css2?${params}&text=${encodeURIComponent(letters)}&display=swap`
}

export function loadFontPreviews(families: readonly string[]) {
  addStylesheet(fontPreviewHref(families))
}
