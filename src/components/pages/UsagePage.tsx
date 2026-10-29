import { usageKind } from '../../data/usageOptions'
import { mockupsBrand } from '../../mockups/mockups'
import type { CoverData, LogoData, Orientation, UsageExample, UsageKind } from '../../types'

type UsagePageProps = {
  kind: UsageKind
  examples: UsageExample[] | null // null → its group is untouched, show the placeholder
  logo: LogoData | null
  cover: CoverData | null
  orientation: Orientation
  color: string // the Skin's Page text color
}

// A page of the Usage section, Correct use or Incorrect use (see specs/usage.md): its examples
// in a grid, each with a ✓ or ✕ mark, under a header like the Logo pages'. The grid's shape
// depends on how many examples there are and on the orientation (shared.css, .usage-grid).
export function UsagePage({ kind, examples, logo, cover, orientation, color }: UsagePageProps) {
  const { label, empty, mark } = usageKind(kind)
  if (!examples) return <p className="manual-page-empty">{empty}</p>

  const brand = mockupsBrand(logo, cover)
  return (
    <div className="logo-page usage-layout" style={{ color }}>
      {/* A <div>, not a <header>, like the Mockups page: this page always has content */}
      <div className="logo-page-header">
        {brand && (
          <p className="logo-page-brand logo-cut" title={brand}>
            {brand}
          </p>
        )}
        <p className="logo-page-heading">{label}</p>
      </div>

      <ul className="usage-grid" data-count={examples.length} data-orientation={orientation} aria-label={label}>
        {examples.map((example, index) => (
          <li key={example.id} className="usage-example" data-kind={kind} aria-label={label}>
            {/* backgroundColor, not background: an empty box keeps its stripes on top */}
            <figure
              className="logo-figure"
              data-empty={!example.image}
              style={{ backgroundColor: example.background ?? undefined }}
            >
              {example.image && <img src={example.image.url} alt={example.description || `Example ${index + 1}`} />}
              <span className="usage-mark" aria-hidden="true">
                {mark}
              </span>
            </figure>
            {example.description && <p className="usage-description logo-clamp" data-lines="2">{example.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
