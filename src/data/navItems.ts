export type NavItem = {
  label: string
  path: string
}

// Sections shown in the header menu, in order.
// The menu is built from this list, so it can grow with new sections later
// (for example Contact or About Us). To add a section:
//   1. Add it here:          { label: 'Contact', path: '/contact' }
//   2. Create its page:      src/pages/ContactPage.tsx
//   3. Create its styles:    src/css/ContactPage.css
//   4. Add its route:        <Route path="/contact" ... /> in src/App.tsx
export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/' },
  { label: 'Brand Manual', path: '/brand-manual' },
]
