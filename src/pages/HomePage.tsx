import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { useLocation } from 'react-router'
import { Hero } from '../components/landing/Hero'
import { Marquee } from '../components/landing/Marquee'
import { About } from '../components/landing/About'
import { Services } from '../components/landing/Services'
import { Work } from '../components/landing/Work'
import { Tool } from '../components/landing/Tool'
import { Contact } from '../components/landing/Contact'
import { Footer } from '../components/landing/Footer'
import { loadGoogleFont } from '../utils/googleFonts'
import { useReveal } from '../utils/useReveal'
import '../css/HomePage.css'

// The poster type of the opening (Hero, Marquee); one weight is enough, Anton is already heavy
const POSTER_FONT = 'Anton'
// The headings of the rest: a tight grotesque, in bold (loaded with every variant)
const DISPLAY_FONT = 'Inter Tight'

const FONT_VARIABLES = {
  '--poster': `'${POSTER_FONT}', var(--heading)`,
  '--display': `'${DISPLAY_FONT}', var(--heading)`,
} as CSSProperties

// The studio landing page (specs/landing.md). Its content lives in src/data/landing.ts.
export function HomePage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const { hash, key } = useLocation()
  useReveal(rootRef)

  useEffect(() => {
    loadGoogleFont(POSTER_FONT, 'regular')
    loadGoogleFont(DISPLAY_FONT)
  }, [])

  // React Router does not scroll to "#work" by itself. `key` changes on every click,
  // so clicking the same section twice scrolls again. An unknown section goes to the top.
  useEffect(() => {
    if (!hash) return
    const target = document.getElementById(decodeURIComponent(hash.slice(1)))
    const section = target && rootRef.current?.contains(target) ? target : document.getElementById('top')
    // `?.`: jsdom, used by the tests, has no scrollIntoView
    section?.scrollIntoView?.({ block: 'start' })
  }, [hash, key])

  return (
    <div ref={rootRef} className="landing" style={FONT_VARIABLES}>
      <Hero />
      <Marquee />
      <About />
      <Services />
      <Work />
      <Tool />
      <Contact />
      <Footer />
    </div>
  )
}
