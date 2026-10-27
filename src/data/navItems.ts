export type NavItem = {
  label: string
  path: string
  // 'page': a page of the app, marked as current while open.
  // 'section': a part of Home (/#id), never marked as current.
  kind: 'page' | 'section'
}

// Items shown in the header menu, in order (see specs/navmenu.md, "Adding Sections").
//   A page:     { label: 'Pricing', path: '/pricing', kind: 'page' }, plus its page,
//               its styles and its route in src/App.tsx
//   A section:  { label: 'Press', path: '/#press', kind: 'section' }, plus id="press" on the landing
export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/', kind: 'page' },
  { label: 'About', path: '/#about', kind: 'section' },
  { label: 'Services', path: '/#services', kind: 'section' },
  { label: 'Work', path: '/#work', kind: 'section' },
  { label: 'Contact', path: '/#contact', kind: 'section' },
  { label: 'Brand Manual', path: '/brand-manual', kind: 'page' },
]
