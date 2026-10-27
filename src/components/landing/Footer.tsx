import { Link } from 'react-router'
import { STUDIO } from '../../data/landing'
import { NAV_ITEMS } from '../../data/navItems'

export function Footer() {
  return (
    <footer className="landing-footer">
      <span>
        © {new Date().getFullYear()} {STUDIO.name}
      </span>
      <nav aria-label="Sections">
        {NAV_ITEMS.filter((item) => item.kind === 'section').map((item) => (
          <Link key={item.path} to={item.path}>
            {item.label}
          </Link>
        ))}
      </nav>
      <Link to="/#top">Back to top ↑</Link>
    </footer>
  )
}
