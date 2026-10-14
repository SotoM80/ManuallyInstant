import { primaryText, usageRules, versionName } from '../../data/logoCopy'
import type { LogoData } from '../../types'

type LogoVersionsPageProps = {
  logo: LogoData | null // null → its section is untouched, show the placeholder
  coverLogo: { url: string } | null // the logo applied in the Cover section, if any
  color: string // the Cover's Typography color
}

// Chapter 2 of the Logo section: 2.1 Primary version, 2.2 the other versions, 2.3 usage.
// Same markup for every template; the template's CSS decides where each block sits.
export function LogoVersionsPage({ logo, coverLogo, color }: LogoVersionsPageProps) {
  if (!logo) return <p className="manual-page-empty">Your logo versions</p>

  const [primary, ...others] = logo.variants
  const primaryName = versionName(primary.name, 0)
  // With no image of its own, the Primary version is the Cover's logo
  const primaryImage = primary.image ?? coverLogo
  const rules = usageRules(logo)
  return (
    <div className="logo-page versions-layout" style={{ color }}>
      <header className="logo-page-header">
        <p className="logo-page-brand logo-cut" title={logo.brandName}>
          {logo.brandName}
        </p>
        <p className="logo-page-heading">Logo versions</p>
      </header>

      <section className="logo-block versions-primary">
        <p className="logo-block-title">2.1 Primary version</p>
        <figure className="logo-figure" data-empty={!primaryImage}>
          {primaryImage && <img src={primaryImage.url} alt={`${primaryName} version`} />}
        </figure>
        <p className="logo-version-name logo-cut" title={primaryName}>
          {primaryName}
        </p>
        <p className="logo-text logo-clamp">{primaryText(logo)}</p>
      </section>

      {/* With a single version there is nothing else to show */}
      {others.length > 0 && (
        <section className="logo-block versions-others">
          <p className="logo-block-title">2.2 Other versions</p>
          <ul className="logo-versions" data-count={others.length}>
            {others.map((variant, index) => {
              const name = versionName(variant.name, index + 1)
              return (
                <li key={index} className="logo-version">
                  <figure className="logo-figure" data-empty={!variant.image}>
                    {variant.image && <img src={variant.image.url} alt={`${name} version`} />}
                  </figure>
                  <p className="logo-version-name logo-cut" title={name}>
                    {name}
                  </p>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section className="logo-block versions-usage">
        <p className="logo-block-title">2.3 Usage</p>
        {rules.length > 0 ? (
          <ul className="logo-rules">
            {rules.map((rule, index) => (
              <li key={index} className="logo-text logo-clamp" data-lines="2">
                {rule}
              </li>
            ))}
          </ul>
        ) : (
          <p className="logo-text manual-page-empty">Where each version is used</p>
        )}
      </section>
    </div>
  )
}
