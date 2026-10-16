import { colorValues } from '../../data/colorPalette'
import type { ExportKind } from '../../export/exportSettings'
import type { PaletteColor } from '../../types'

type ColorPalettePageProps = {
  palette: PaletteColor[] | null // null → the Colors section is untouched, show the placeholder
  color: string // the Skin's Page text color
  emphasis?: ExportKind // in a PDF: print highlights CMYK, web highlights HEX and RGB (specs/export.md)
}

type ValueRow = { key: 'hex' | 'rgb' | 'cmyk'; label: string }
const HEX: ValueRow = { key: 'hex', label: 'HEX' }
const RGB: ValueRow = { key: 'rgb', label: 'RGB' }
const CMYK: ValueRow = { key: 'cmyk', label: 'CMYK ≈' }

// The values in the order each one shows them, and which are highlighted
const VALUE_ROWS: Record<ExportKind | 'preview', { rows: ValueRow[]; strong: ValueRow[] }> = {
  preview: { rows: [HEX, RGB, CMYK], strong: [] },
  print: { rows: [CMYK, HEX, RGB], strong: [CMYK] },
  web: { rows: [HEX, RGB, CMYK], strong: [HEX, RGB] },
}

// Same markup for every template; the template's CSS decides how the colors are laid out.
export function ColorPalettePage({ palette, color, emphasis }: ColorPalettePageProps) {
  if (!palette) return <p className="manual-page-empty">Your color palette</p>
  const { rows, strong } = VALUE_ROWS[emphasis ?? 'preview']

  // data-count lets a template pick its grid (e.g. 2 × 2 for four colors).
  return (
    <div className="palette-layout" style={{ color }} data-emphasis={emphasis}>
      <p className="palette-heading">Color palette</p>
      <ul className="palette-colors" data-count={palette.length}>
        {palette.map((entry, index) => {
          const values = colorValues(entry.hex)
          return (
            <li key={index} className="palette-color">
              <span className="palette-chip" style={{ background: entry.hex }} />
              <div className="palette-info">
                <p className="palette-name">{entry.name || `Color ${index + 1}`}</p>
                <p className="palette-values">
                  {rows.map((row) => (
                    <span
                      key={row.key}
                      data-strength={emphasis ? (strong.includes(row) ? 'strong' : 'soft') : undefined}
                    >
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
