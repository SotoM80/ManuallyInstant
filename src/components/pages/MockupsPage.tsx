import { MockupArt } from './MockupArt'
import { findMockup } from '../../mockups/products'
import { mockupLogo, mockupsBrand } from '../../mockups/mockups'
import type { Mockups } from '../../mockups/types'
import type { CoverData, LogoData } from '../../types'

type MockupsPageProps = {
  mockups: Mockups
  logo: LogoData | null
  cover: CoverData | null
  color: string // the Skin's Page text color
}

// The Mockups page: the ticked products with the logo on them, under a header like the Logo
// pages' (so every template places it the same way). See specs/mockups.md.
export function MockupsPage({ mockups, logo, cover, color }: MockupsPageProps) {
  const brand = mockupsBrand(logo, cover)
  const products = mockups.chosen.map(findMockup).filter((product) => product !== undefined)
  return (
    <div className="logo-page mockups-layout" style={{ color }}>
      {/* A <div>, not a <header>: unlike the Logo pages, this page always has content, and a
          <header> would read as a second banner of the site next to the real one */}
      <div className="logo-page-header">
        {brand && (
          <p className="logo-page-brand logo-cut" title={brand}>
            {brand}
          </p>
        )}
        <p className="logo-page-heading">Mockups</p>
      </div>

      {products.length === 0 ? (
        <p className="manual-page-empty">Choose mockups in the Mockups section</p>
      ) : (
        <ul className="mockups-grid" data-count={products.length}>
          {products.map((product) => {
            const settings = mockups.settings[product.id]
            return (
              <li key={product.id} className="mockup">
                <MockupArt
                  product={product}
                  color={settings.color}
                  logo={mockupLogo(logo, cover?.logo ?? null, settings.version)}
                />
                <p className="mockup-name">{product.name}</p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
