import type { CSSProperties } from 'react'
import { LOGO_SCALES } from '../../data/logoOptions'
import { toTitleCss } from '../../data/titleOptions'
import type { CoverData } from '../../types'

type CoverPageProps = {
  cover: CoverData | null // null → the Cover section is untouched, show placeholders
  titleScale: number
}

// Same three slots for every template; the template's CSS decides where each one sits.
export function CoverPage({ cover, titleScale }: CoverPageProps) {
  if (!cover) {
    return (
      <div className="cover-layout">
        <p className="cover-title manual-page-empty">Your brand manual title</p>
        <p className="cover-logo manual-page-empty">Your logo</p>
        <p className="cover-designed-by manual-page-empty">Designed by …</p>
      </div>
    )
  }

  // Each empty field keeps its own placeholder, so the page fills in as the user types.
  const titleCss = toTitleCss(cover.style)
  const pageTitleCss = {
    ...titleCss,
    color: cover.colors.title,
    fontSize: `${parseFloat(String(titleCss.fontSize)) * titleScale}px`,
  }
  // The logo size scales the image inside its area (see .cover-logo img in shared.css)
  const logoCss = { '--logo-scale': LOGO_SCALES[cover.logo?.size ?? 'Medium'] } as CSSProperties
  // The Text color is set on the whole layout so "Designed by" (and the divider of
  // Template 3) take it; the title has its own Title color.
  return (
    <div className="cover-layout" style={{ color: cover.colors.text }}>
      {cover.title ? (
        <p className="cover-title" style={pageTitleCss}>
          {cover.title}
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
