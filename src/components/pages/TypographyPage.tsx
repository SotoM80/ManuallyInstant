import { toFontFamilyCss } from '../../data/fontOptions'
import type { BrandFonts } from '../../types'

type TypographyPageProps = {
  fonts: BrandFonts | null // null → nothing saved yet, show the placeholder
  color: string // the Cover's Typography color
}

const USAGES: { key: keyof BrandFonts; label: string }[] = [
  { key: 'primary', label: 'Primary · Headings' },
  { key: 'secondary', label: 'Secondary · Body text' },
]

const ALPHABET = ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz', '0123456789']

// Same markup for every template; the template's CSS decides where each font sits.
export function TypographyPage({ fonts, color }: TypographyPageProps) {
  if (!fonts) return <p className="manual-page-empty">Your typography</p>

  return (
    <div className="type-layout" style={{ color }}>
      <p className="type-heading">Typography</p>
      <ul className="type-fonts">
        {USAGES.map((usage) => {
          const family = fonts[usage.key]
          return (
            // The usage label stays in the page's font; everything else is drawn in the brand font
            <li key={usage.key} className="type-font">
              <p className="type-sample" style={{ fontFamily: toFontFamilyCss(family) }} aria-hidden="true">
                Aa
              </p>
              <div className="type-info">
                <p className="type-usage">{usage.label}</p>
                <p className="type-name" style={{ fontFamily: toFontFamilyCss(family) }}>
                  {family}
                </p>
                <p className="type-alphabet" style={{ fontFamily: toFontFamilyCss(family) }}>
                  {ALPHABET.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
