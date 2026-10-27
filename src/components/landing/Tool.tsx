import { Link } from 'react-router'

// The studio's own tool. The manual on the right is drawn in CSS (a cover, a palette and
// a type page), so it needs no image file; it is decoration only.
export function Tool() {
  return (
    <section id="tool" className="landing-section landing-tool" aria-label="ManuallyInstant">
      <div className="landing-tool-text reveal">
        <h2 className="landing-label">Built in-house</h2>
        <p className="landing-tool-title">ManuallyInstant</p>
        <p>
          Our own tool for visual identity manuals: cover, logo, usage, colors, typography and
          mockups, exported as print and screen PDFs in minutes.
        </p>
        <Link className="landing-button landing-button-solid" to="/brand-manual">
          Try ManuallyInstant
        </Link>
      </div>

      <div className="landing-tool-manual reveal" aria-hidden="true">
        <div className="landing-tool-page landing-tool-page-type">Aa</div>
        <div className="landing-tool-page landing-tool-page-colors">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="landing-tool-page landing-tool-page-cover">
          <span className="landing-tool-cover-logo" />
          <span className="landing-tool-cover-title">Brand Manual</span>
        </div>
      </div>
    </section>
  )
}
