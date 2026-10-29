import { useState } from 'react'
import { ColorPicker } from './ColorPicker'
import { INVALID_HEX_MESSAGE, normalizeHex } from '../data/colorPalette'
import type { PaletteColor } from '../types'

// A color of the Skin: the Cover's color picker, plus a chip per palette color that copies it
// (see specs/skins.md and ADR 0011). The field keeps what is being typed; only a valid HEX
// reaches the skin, so the pages keep the last valid color meanwhile.
// With `allowNone`, a "none" chip comes first and the value may be null (no color at all), as
// for the background of an image (specs/imagebackground.md).
type SkinColorFieldProps<Value extends string | null> = {
  label: string
  value: Value // the color in use, "#RRGGBB" (or null → none, with allowNone)
  onChange: (hex: Value) => void
  palette: PaletteColor[] | null
  allowNone?: boolean
}

export function SkinColorField<Value extends string | null = string>({
  label,
  value,
  onChange,
  palette,
  allowNone,
}: SkinColorFieldProps<Value>) {
  const [typed, setTyped] = useState<string | null>(null) // null → the field shows `value`
  const [error, setError] = useState('')
  const chips = (palette ?? []).filter((color) => normalizeHex(color.hex))

  function use(hex: Value) {
    setTyped(null)
    setError('')
    onChange(hex)
  }

  function type(text: string) {
    setTyped(text)
    setError('')
    const hex = normalizeHex(text)
    if (hex) onChange(hex as Value)
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
        value={typed ?? value ?? ''}
        error={error}
        onChange={type}
        onSelect={(hex) => use(hex as Value)}
        onCommit={commit}
      />
      {(chips.length > 0 || allowNone) && (
        <div className="skin-color-chips">
          {allowNone && (
            <button
              type="button"
              className="palette-block-chip skin-color-chip skin-color-none"
              aria-label={`${label}: none`}
              aria-pressed={value === null}
              title="No background"
              onClick={() => use(null as Value)}
            />
          )}
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
                onClick={() => use(normalizeHex(color.hex)! as Value)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
