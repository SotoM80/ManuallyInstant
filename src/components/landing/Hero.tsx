import { Link } from 'react-router'
import { STUDIO } from '../../data/landing'
import { ManualMockup } from './ManualMockup'

export function Hero() {
  return (
    <section id="top" className="landing-hero">
      <div className="landing-hero-text">
        <h1 className="landing-hero-title">{STUDIO.name}</h1>
        <p className="landing-hero-claim">{STUDIO.claim}</p>
        <div className="landing-hero-actions">
          <Link className="landing-button landing-button-solid" to="/#work">
            See our work
          </Link>
          <Link className="landing-button" to="/brand-manual">
            Start your brand manual
          </Link>
        </div>
      </div>
      <ManualMockup />
    </section>
  )
}
