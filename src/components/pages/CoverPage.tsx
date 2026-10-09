import { toTitleCss } from '../../data/titleOptions'
import type { CoverData } from '../../types'

type CoverPageProps = {
  cover: CoverData | null // null → nothing saved yet, show placeholders
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

  const titleCss = toTitleCss(cover.style)
  const pageTitleCss = {
    ...titleCss,
    color: cover.colors.typography,
    fontSize: `${parseFloat(String(titleCss.fontSize)) * titleScale}px`,
  }
  // The Typography color is set on the whole layout so "Designed by" (and the
  // divider of Template 3) take it too.
  return (
    <div className="cover-layout" style={{ color: cover.colors.typography }}>
      <p className="cover-title" style={pageTitleCss}>
        {cover.title}
      </p>
      <div className="cover-logo">
        <img src={cover.logo.url} alt="Logo" />
      </div>
      <p className="cover-designed-by">Designed by {cover.designedBy}</p>
    </div>
  )
}
