import { Link } from 'react-router'
import { SectionLabel } from './SectionLabel'

const STEPS = [
  { title: 'Fill in your brand', text: 'Cover, logo, usage, colors with HEX, RGB and CMYK, fonts and mockups.' },
  { title: 'Choose a template and a skin', text: 'Three layouts and a background of gradients, shapes or textures.' },
  { title: 'Export the PDFs', text: 'One for print, one for screen: a 10-page manual, ready to send.' },
]

// The studio's own tool, shown as a product: how it works in three steps.
export function Tool() {
  return (
    <section id="tool" className="landing-section landing-tool" aria-label="ManuallyInstant">
      <SectionLabel number={4}>Built in-house</SectionLabel>
      <div className="landing-tool-intro reveal">
        <p className="landing-section-title">ManuallyInstant</p>
        <p>Our own tool for visual identity manuals, from a blank page to two PDFs in minutes.</p>
      </div>
      <ol className="landing-steps">
        {STEPS.map((step, index) => (
          <li key={step.title} className="landing-step reveal">
            <span className="landing-step-number">{index + 1}</span>
            <span className="landing-step-title">{step.title}</span>
            <span className="landing-step-text">{step.text}</span>
          </li>
        ))}
      </ol>
      <Link className="landing-button landing-button-solid reveal" to="/brand-manual">
        Try ManuallyInstant
      </Link>
    </section>
  )
}
