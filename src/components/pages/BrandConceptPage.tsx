import { philosophyText } from '../../data/logoCopy'
import type { LogoData } from '../../types'

type BrandConceptPageProps = {
  logo: LogoData | null // null → nothing saved yet, show the placeholder
  coverLogo: { url: string } | null // the logo uploaded in the Cover section, if saved
  color: string // the Cover's Typography color
}

// 1.1 Philosophy of the Logo section: the idea behind the brand, next to its logo (the one
// of the Cover). Same markup for every template; the template's CSS decides where each
// block sits. Long names are cut with "…" (the full text is in the tooltip) and long texts
// are cut after a few lines, so nothing pushes the blocks off the page.
export function BrandConceptPage({ logo, coverLogo, color }: BrandConceptPageProps) {
  if (!logo) return <p className="manual-page-empty">Your brand concept</p>

  const [intro, concept, closing] = philosophyText(logo)
  return (
    <div className="logo-page concept-layout" style={{ color }}>
      <header className="logo-page-header">
        <p className="logo-page-brand logo-cut" title={logo.brandName}>
          {logo.brandName}
        </p>
        <p className="logo-page-heading">Brand concept</p>
      </header>

      <section className="logo-block concept-philosophy">
        <p className="logo-block-title">1.1 Philosophy</p>
        <p className="logo-text logo-clamp" data-lines="6">
          {intro} <span className="logo-quote">{concept}</span> {closing}
        </p>
      </section>

      {/* The Cover's logo; until the Cover is saved, a faint box shows where it goes */}
      <figure className="logo-figure concept-logo" data-empty={!coverLogo}>
        {coverLogo ? (
          <img src={coverLogo.url} alt={`${logo.brandName} logo`} />
        ) : (
          <span className="concept-logo-empty">Logo of the Cover</span>
        )}
      </figure>
    </div>
  )
}
