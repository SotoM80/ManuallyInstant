import { useCallback, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router'
import { NAV_ITEMS } from '../data/navItems'
import { useDismiss } from '../utils/useDismiss'
import { useMediaQuery } from '../utils/useMediaQuery'
import '../css/NavMenu.css'

// Same width as the media query in NavMenu.css
const NARROW = '(max-width: 768px)'

// Renders one link per item in NAV_ITEMS. New items go in src/data/navItems.ts.
// On narrow screens the list folds into a Menu button.
export function NavMenu() {
  const navRef = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)
  const narrow = useMediaQuery(NARROW)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(navRef, open, close)

  return (
    <nav ref={navRef} className="nav-menu" aria-label="Main" data-open={open}>
      <button
        type="button"
        className="nav-menu-toggle"
        aria-expanded={open}
        aria-controls="nav-menu-list"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="nav-menu-toggle-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="visually-hidden">Menu</span>
      </button>

      {/* Always in the page so it can slide; inert while folded on a narrow screen */}
      <div id="nav-menu-list" className="nav-menu-list" inert={narrow && !open}>
        {NAV_ITEMS.map((item) =>
          item.kind === 'section' ? (
            // Link, not NavLink: NavLink ignores the "#…", so every section would look current
            <Link key={item.path} to={item.path} onClick={close}>
              {item.label}
            </Link>
          ) : (
            // `end` on "/": Home is only active on "/" itself, not on every page under it
            <NavLink key={item.path} to={item.path} end={item.path === '/'} onClick={close}>
              {item.label}
            </NavLink>
          ),
        )}
      </div>
    </nav>
  )
}
