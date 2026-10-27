import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { useLocation } from 'react-router'
import { Hero } from '../components/landing/Hero'
import { Disciplines } from '../components/landing/Disciplines'
import { About } from '../components/landing/About'
import { Services } from '../components/landing/Services'
import { Work } from '../components/landing/Work'
import { Tool } from '../components/landing/Tool'
import { Contact } from '../components/landing/Contact'
import { Footer } from '../components/landing/Footer'
import { loadGoogleFont } from '../utils/googleFonts'
import { useReveal } from '../utils/useReveal'
import '../css/HomePage.css'

// The headings of the landing: a tight grotesque, in bold (loaded with every variant)
const DISPLAY_FONT = 'Inter Tight'

// The studio landing page (specs/landing.md). Its content lives in src/data/landing.ts.
export function HomePage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const { hash, key } = useLocation()
  useReveal(rootRef)

  useEffect(() => {
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
    <div ref={rootRef} className="landing" style={{ '--display': `'${DISPLAY_FONT}', var(--heading)` } as CSSProperties}>
      <Hero />
      <Disciplines />
      <About />
      <Services />
      <Work />
      <Tool />
      <Contact />
      <Footer />
    </div>
  )
}
