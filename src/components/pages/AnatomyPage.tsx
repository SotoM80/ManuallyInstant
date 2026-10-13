import { Fragment } from 'react'
import type { CSSProperties } from 'react'
import { anatomyText } from '../../data/logoCopy'
import type { LogoData, UploadedImage } from '../../types'

type AnatomyPageProps = {
  logo: LogoData | null // null → nothing saved yet, show the placeholder
  color: string // the Cover's Typography color
}

type CardContentProps = {
  label: string // the mark type or the part's label, e.g. "Imagotype", "Tagline"
  name: string
  role: string
  image: UploadedImage | null
}

// What a card shows: its image (or a faint striped box), its label, and its name and role
// when they were typed.
function CardContent({ label, name, role, image }: CardContentProps) {
  return (
    <>
      <figure className="logo-figure" data-empty={!image}>
        {image && <img src={image.url} alt={name || label} />}
      </figure>
      <p className="logo-card-type logo-cut" title={label}>
        {label}
      </p>
      {name && (
        <p className="logo-card-name logo-cut" title={name}>
          {name}
        </p>
      )}
      {role && (
        <p className="logo-card-role logo-clamp" data-lines="2">
          {role}
        </p>
      )}
    </>
  )
}

// 1.2 Anatomy of the Logo section: the mark types the brand uses, each as a card, and how
// each one is built from its parts. Same markup for every template; the template's CSS
// decides where each block sits.
export function AnatomyPage({ logo, color }: AnatomyPageProps) {
  if (!logo) return <p className="manual-page-empty">Your anatomy</p>

  return (
    <div className="logo-page anatomy-layout" style={{ color }}>
      <header className="logo-page-header">
        <p className="logo-page-brand logo-cut" title={logo.brandName}>
          {logo.brandName}
        </p>
        <p className="logo-page-heading">Anatomy</p>
      </header>

      <section className="logo-block anatomy-marks">
        <p className="logo-block-title">1.2 Anatomy</p>
        <p className="logo-text logo-clamp">{anatomyText(logo)}</p>
        {/* One row per mark type. Without parts it is a single card; with parts, the row
            reads how it is built: Isotype + Logotype + Tagline = Imagotype. */}
        <ol className="logo-cards" aria-label="Marks of the brand" data-count={logo.marks.length}>
          {logo.marks.map((mark) => (
            <li key={mark.type} className="logo-equation" aria-label={mark.type}>
              {mark.parts.length > 0 && (
                <>
                  <ol
                    className="logo-parts"
                    aria-label={`Parts of the ${mark.type}`}
                    style={{ '--parts': mark.parts.length } as CSSProperties}
                  >
                    {mark.parts.map((part, index) => (
                      <Fragment key={index}>
                        {index > 0 && (
                          <li className="logo-card-sign" aria-hidden="true">
                            +
                          </li>
                        )}
                        <li className="logo-card">
                          <CardContent label={part.label} name={part.name} role={part.role} image={part.image} />
                        </li>
                      </Fragment>
                    ))}
                  </ol>
                  <span className="logo-card-sign" aria-hidden="true">
                    =
                  </span>
                </>
              )}
              <div className="logo-card logo-card-result">
                <CardContent label={mark.type} name={mark.name} role={mark.role} image={mark.image} />
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
