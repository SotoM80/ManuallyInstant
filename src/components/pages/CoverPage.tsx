import type { CSSProperties } from 'react'
import { LOGO_SCALES } from '../../data/logoOptions'
import { DEFAULT_TITLE_STYLE, toTitleCss } from '../../data/titleOptions'
import type { CoverData } from '../../types'

type CoverPageProps = {
  cover: CoverData | null // null → the Cover section is untouched, show placeholders
}

// The whole Cover is drawn in the title's family (its Font family, Regular for "Designed by" and
// the placeholders): a Google Font keeps the same shapes at every size, while the system font
// changes them, so the text would take a different share of the page in each view (ADR 0027)
function coverFont(family: string) {
  return `'${family}', sans-serif`
}

// Same three slots for every template; the template's CSS decides where each one sits.
export function CoverPage({ cover }: CoverPageProps) {
  if (!cover) {
    return (
      <div className="cover-layout" style={{ fontFamily: coverFont(DEFAULT_TITLE_STYLE.fontFamily) }}>
        <p className="cover-title manual-page-empty">Your brand manual title</p>
        <p className="cover-logo manual-page-empty">Your logo</p>
        <p className="cover-designed-by manual-page-empty">Designed by …</p>
      </div>
    )
  }

  // Each empty field keeps its own placeholder, so the page fills in as the user types.
  // Its size is measured on the page (cqw), so it is the same in every view (ADR 0027)
  const pageTitleCss = { ...toTitleCss(cover.style), color: cover.colors.title }
  // The logo size scales the image inside its area (see .cover-logo img in shared.css)
  const logoCss = { '--logo-scale': LOGO_SCALES[cover.logo?.size ?? 'Medium'] } as CSSProperties
  // The Text color is set on the whole layout so "Designed by" (and the divider of
  // Template 3) take it; the title has its own Title color.
  return (
    <div className="cover-layout" style={{ color: cover.colors.text, fontFamily: coverFont(cover.style.fontFamily) }}>
      {cover.title ? (
        <p className="cover-title" style={pageTitleCss}>
          {cover.title}
        </p>
      ) : (
        <p className="cover-title manual-page-empty">Your brand manual title</p>
      )}
      {cover.logo ? (
        <div className="cover-logo" style={logoCss}>
          <img src={cover.logo.url} alt="Logo" />
        </div>
      ) : (
        <p className="cover-logo manual-page-empty">Your logo</p>
      )}
      {cover.designedBy ? (
        <p className="cover-designed-by">Designed by {cover.designedBy}</p>
      ) : (
        <p className="cover-designed-by manual-page-empty">Designed by …</p>
      )}
    </div>
  )
}
