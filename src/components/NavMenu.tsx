import { NavLink } from 'react-router'
import { NAV_ITEMS } from '../data/navItems'
import '../css/NavMenu.css'

// Renders one link per section in NAV_ITEMS. New sections go in src/data/navItems.ts.
export function NavMenu() {
  return (
    <nav className="nav-menu" aria-label="Main">
      {NAV_ITEMS.map((item) => (
        // `end` on "/": Home is only active on "/" itself, not on every page under it
        <NavLink key={item.path} to={item.path} end={item.path === '/'}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
