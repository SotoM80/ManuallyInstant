import { colorValues } from '../../data/colorPalette'
import type { PaletteColor } from '../../types'

type ColorPalettePageProps = {
  palette: PaletteColor[] | null // null → nothing saved yet, show the placeholder
  color: string // the Cover's Typography color
}

const VALUE_ROWS = [
  { key: 'hex', label: 'HEX' },
  { key: 'rgb', label: 'RGB' },
  { key: 'cmyk', label: 'CMYK ≈' },
] as const

// Same markup for every template; the template's CSS decides how the colors are laid out.
export function ColorPalettePage({ palette, color }: ColorPalettePageProps) {
  if (!palette) return <p className="manual-page-empty">Your color palette</p>

  // data-count lets a template pick its grid (e.g. 2 × 2 for four colors).
  return (
    <div className="palette-layout" style={{ color }}>
      <p className="palette-heading">Color palette</p>
      <ul className="palette-colors" data-count={palette.length}>
        {palette.map((entry, index) => {
          const values = colorValues(entry.hex)
          return (
            <li key={index} className="palette-color">
              <span className="palette-chip" style={{ background: entry.hex }} />
              <div className="palette-info">
                <p className="palette-name">{entry.name}</p>
                <p className="palette-values">
                  {VALUE_ROWS.map((row) => (
                    <span key={row.key}>
                      <span className="palette-label">{row.label}</span>{' '}
                      <span className="palette-value">{values[row.key]}</span>
                    </span>
                  ))}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="palette-note">CMYK values are approximate</p>
    </div>
  )
}
