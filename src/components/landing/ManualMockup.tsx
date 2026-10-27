// Three pages of a manual (a cover, a palette and a type page), drawn in CSS so they need
// no image file. Decoration only.
export function ManualMockup() {
  return (
    <div className="landing-manual" aria-hidden="true">
      <div className="landing-manual-page landing-manual-page-type">Aa</div>
      <div className="landing-manual-page landing-manual-page-colors">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="landing-manual-page landing-manual-page-cover">
        <span className="landing-manual-cover-logo" />
        <span className="landing-manual-cover-title">Brand Manual</span>
      </div>
    </div>
  )
}
