import { useState } from 'react'
import { MockupArt } from './pages/MockupArt'
import { SkinColorField } from './SkinColorField'
import { MOCKUP_GROUPS, MOCKUP_PRODUCTS, findMockup } from '../mockups/products'
import {
  MAX_MOCKUPS,
  chosenVersion,
  mockupLogo,
  setMockupColor,
  setMockupVersion,
  toggleMockup,
  versionOptions,
} from '../mockups/mockups'
import { keepInPlace } from '../utils/scrollAnchor'
import type { Mockups } from '../mockups/types'
import type { CoverData, LogoData, PaletteColor } from '../types'

// Form of the Mockups section: the products as checkboxes (up to four), then the settings of each
// ticked one, folded like the layers of the Skin: its color and its logo version. Everything
// reaches the preview at once (see specs/mockups.md).
type MockupsFormProps = {
  mockups: Mockups
  onChange: (mockups: Mockups) => void
  logo: LogoData | null
  cover: CoverData | null
  palette: PaletteColor[] | null // offered as chips that copy a color
}

export function MockupsForm({ mockups, onChange, logo, cover, palette }: MockupsFormProps) {
  const [openId, setOpenId] = useState<string | null>(null) // null → every block folded
  const full = mockups.chosen.length >= MAX_MOCKUPS
  const options = versionOptions(logo)

  // Ticking a product opens its block (and folds the open one)
  function toggle(id: string) {
    const ticking = !mockups.chosen.includes(id)
    onChange(toggleMockup(mockups, id))
    if (ticking) setOpenId(id)
    else if (openId === id) setOpenId(null)
  }

  return (
    <form onSubmit={(event) => event.preventDefault()} noValidate aria-label="Mockups">
      <fieldset className="mockup-products">
        <legend>Products</legend>
        {MOCKUP_GROUPS.map((group) => {
          const products = MOCKUP_PRODUCTS.filter((product) => product.group === group.group)
          if (products.length === 0) return null
          return (
            <div key={group.group} className="mockup-group">
              <p className="skin-gallery-heading">{group.label}</p>
              {products.map((product) => {
                const ticked = mockups.chosen.includes(product.id)
                return (
                  <label key={product.id} className="mockup-choice">
                    <input
                      type="checkbox"
                      checked={ticked}
                      disabled={!ticked && full}
                      onChange={() => toggle(product.id)}
                    />
                    <span className="mockup-thumb">
                      <MockupArt product={product} color={mockups.settings[product.id].color} logo={null} decorative />
                    </span>
                    {product.name}
                  </label>
                )
              })}
            </div>
          )
        })}
      </fieldset>
      {full && <p className="logo-form-hint">Up to {MAX_MOCKUPS} mockups.</p>}

      {mockups.chosen.map(findMockup).map((product) => {
        if (!product) return null
        const settings = mockups.settings[product.id]
        const isOpen = openId === product.id
        const bodyId = `mockup-${product.id}-body`
        const selectId = `mockup-${product.id}-logo`
        // A removed version reads Primary; one with no image yet stays chosen (chosenVersion)
        const version = chosenVersion(logo, settings.version)
        return (
          <div key={product.id} className="palette-block mockup-settings" data-open={isOpen}>
            <button
              type="button"
              className="palette-block-header"
              aria-expanded={isOpen}
              aria-controls={bodyId}
              onClick={(event) => {
                keepInPlace(event.currentTarget) // the block above may fold
                setOpenId(isOpen ? null : product.id)
              }}
            >
              <span className="mockup-thumb">
                <MockupArt
                  product={product}
                  color={settings.color}
                  logo={mockupLogo(logo, cover?.logo ?? null, settings.version)}
                  decorative
                />
              </span>
              <span className="palette-block-title">{product.name}</span>
              <span className="palette-block-chevron" aria-hidden="true" />
            </button>

            {/* Always in the page so it can fold and unfold; inert while folded */}
            <div id={bodyId} className="palette-block-body" inert={!isOpen}>
              <div className="palette-block-inner">
                <SkinColorField
                  label={`${product.name} ${product.colorLabel.toLowerCase()}`}
                  value={settings.color}
                  onChange={(hex) => onChange(setMockupColor(mockups, product.id, hex))}
                  palette={palette}
                />
                <div className="skin-color">
                  <label htmlFor={selectId}>Logo</label>
                  <select
                    id={selectId}
                    aria-label={`${product.name} logo`}
                    value={version === null ? 'primary' : String(version)}
                    onChange={(event) => {
                      const value = event.target.value
                      onChange(setMockupVersion(mockups, product.id, value === 'primary' ? null : Number(value)))
                    }}
                  >
                    {options.map((option) => (
                      <option key={option.value ?? 'primary'} value={option.value ?? 'primary'}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </form>
  )
}
