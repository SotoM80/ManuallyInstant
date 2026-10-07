import { Link } from 'react-router'
import '../css/HomePage.css'

export function HomePage() {
  return (
    <section className="home-page">
      <h1>ManuallyInstant</h1>
      <p>
        Create a visual identity manual in minutes: add your brand title, logo, colors and fonts,
        then export it as a PDF.
      </p>
      <Link className="home-page-start" to="/brand-manual">
        Start your brand manual
      </Link>
    </section>
  )
}
