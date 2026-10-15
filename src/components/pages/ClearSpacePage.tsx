import { GRID_TEXT, clearSpaceText, minSizeRules, versionName } from '../../data/logoCopy'
import type { LogoData } from '../../types'
import type { Guides } from '../../utils/guides'
import { ClearSpaceDiagram } from './ClearSpaceDiagram'
import { ConstructionGrid } from './ConstructionGrid'

type ClearSpacePageProps = {
  logo: LogoData | null // null → its section is untouched, show the placeholder
  coverLogo: { url: string } | null // the logo applied in the Cover section, if any
  color: string
  guides?: Guides // guides clicked on the construction grid
  onGuidesChange?: (guides: Guides) => void // the Cover's Typography color
}

// Chapter 3 of the Logo section: 3.1 Clear space (drawn here from the primary version),
// 3.2 Construction grid (uploaded, or a placeholder box) and 3.3 Minimum sizes.
// Same markup for every template; the template's CSS decides where each block sits.
export function ClearSpacePage({ logo, coverLogo, color, guides, onGuidesChange }: ClearSpacePageProps) {
  if (!logo) return <p className="manual-page-empty">Your clear space</p>

  // The diagram uses the Primary version; with no image of its own, the Cover's logo
  const primary = logo.variants[0]
  const primaryName = versionName(primary?.name ?? '', 0)
  const primaryImage = primary?.image ?? coverLogo
  return (
    <div className="logo-page clearspace-layout" style={{ color }}>
      <header className="logo-page-header">
        <p className="logo-page-brand logo-cut" title={logo.brandName}>
          {logo.brandName}
        </p>
        <p className="logo-page-heading">Clear space</p>
      </header>

      <section className="logo-block clearspace-area">
        <p className="logo-block-title">3.1 Clear space</p>
        <figure className="clearspace-diagram" aria-label="Clear space diagram">
          <ClearSpaceDiagram
            logo={primaryImage}
            name={primaryName}
            modules={logo.gridModules}
            x={logo.gridX}
          />
        </figure>
        <p className="logo-text logo-clamp">{clearSpaceText(logo)}</p>
      </section>

      <section className="logo-block clearspace-grid">
        <p className="logo-block-title">3.2 Construction grid</p>
        {/* An uploaded grid first; else one drawn by the app over the Primary logo */}
        <figure className="logo-figure" data-empty={!logo.grid && !primaryImage}>
          {logo.grid ? (
            <img src={logo.grid.url} alt="Construction grid" />
          ) : primaryImage ? (
            <ConstructionGrid
              logo={primaryImage}
              modules={logo.gridModules}
              x={logo.gridX}
              rulerTop={logo.rulerTop}
              rulerSide={logo.rulerSide}
              guides={guides}
              onGuidesChange={onGuidesChange}
            />
          ) : (
            <span className="clearspace-grid-empty">Construction grid</span>
          )}
        </figure>
        <p className="logo-text logo-clamp" data-lines="2">
          {GRID_TEXT}
        </p>
      </section>

      <section className="logo-block clearspace-sizes">
        <p className="logo-block-title">3.3 Minimum size</p>
        <ul className="logo-rules">
          {minSizeRules(logo).map((rule) => (
            <li key={rule.label} className="logo-text logo-clamp" data-lines="2">
              <strong>{rule.label}:</strong> {rule.text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
