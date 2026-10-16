import { useState } from 'react'
import { ColorPicker } from './ColorPicker'
import { INVALID_HEX_MESSAGE, normalizeHex } from '../data/colorPalette'
import type { PaletteColor } from '../types'

// A color of the Skin: the Cover's color picker, plus a chip per palette color that copies it
// (see specs/skins.md and ADR 0011). The field keeps what is being typed; only a valid HEX
// reaches the skin, so the pages keep the last valid color meanwhile.
type SkinColorFieldProps = {
  label: string
  value: string // the color in use, "#RRGGBB"
  onChange: (hex: string) => void
  palette: PaletteColor[] | null
}

export function SkinColorField({ label, value, onChange, palette }: SkinColorFieldProps) {
  const [typed, setTyped] = useState<string | null>(null) // null → the field shows `value`
  const [error, setError] = useState('')
  const chips = (palette ?? []).filter((color) => normalizeHex(color.hex))

  function use(hex: string) {
    setTyped(null)
    setError('')
    onChange(hex)
  }

  function type(text: string) {
    setTyped(text)
    setError('')
    const hex = normalizeHex(text)
    if (hex) onChange(hex)
  }

  // On blur or Enter: a valid HEX is tidied, a blank one goes back to the color in use
  function commit() {
    if (typed === null) return
    if (typed.trim() === '' || normalizeHex(typed)) setTyped(null)
    else setError(INVALID_HEX_MESSAGE)
  }

  return (
    <div className="skin-color-field">
      <ColorPicker
        label={label}
        value={typed ?? value}
        error={error}
        onChange={type}
        onSelect={use}
        onCommit={commit}
      />
      {chips.length > 0 && (
        <div className="skin-color-chips">
          {chips.map((color) => {
            const name = color.name || `Color ${palette!.indexOf(color) + 1}`
            return (
              <button
                key={color.id}
                type="button"
                className="palette-block-chip skin-color-chip"
                style={{ background: color.hex }}
                aria-label={`${label}: use ${name}`}
                title={`Use ${name}`}
                onClick={() => use(normalizeHex(color.hex)!)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
