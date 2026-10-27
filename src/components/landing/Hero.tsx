import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { STUDIO } from '../../data/landing'

// The studio name in giant type; its letters rise one after another (`--i` sets each delay).
// Screen readers get the name once, from the hidden copy, not letter by letter.
export function Hero() {
  let letterIndex = 0
  return (
    <section id="top" className="landing-hero">
      <h1 className="landing-hero-title">
        <span className="visually-hidden">{STUDIO.name}</span>
        <span aria-hidden="true">
          {STUDIO.name.split(' ').map((word, wordIndex) => (
            <span key={wordIndex} className="landing-hero-word">
              {[...word].map((letter) => (
                <span key={letterIndex} className="landing-hero-letter" style={{ '--i': letterIndex++ } as CSSProperties}>
                  {letter}
                </span>
              ))}
            </span>
          ))}
        </span>
      </h1>
      <p className="landing-hero-claim">{STUDIO.claim}</p>
      <div className="landing-hero-actions">
        <Link className="landing-button landing-button-solid" to="/#work">
          See our work
        </Link>
        <Link className="landing-button" to="/brand-manual">
          Start your brand manual
        </Link>
      </div>
    </section>
  )
}
