import { useId } from 'react'
import type { KeyboardEvent } from 'react'
import { PALETTE, normalizeHex } from '../data/colorPalette'
import '../css/ColorPicker.css'

type ColorPickerProps = {
  label: string
  value: string // what is in the HEX field, valid or not
  error: string
  onChange: (value: string) => void // every keystroke in the HEX field
  onSelect: (hex: string) => void // a swatch or the custom picker: always a valid "#RRGGBB"
  onCommit: () => void // blur or Enter in the HEX field
}

// Quick swatches + any color (native picker and HEX field), all kept in sync.
export function ColorPicker({ label, value, error, onChange, onSelect, onCommit }: ColorPickerProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hex = normalizeHex(value)

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    onCommit()
  }

  return (
    <fieldset className="color-picker">
      <legend>{label}</legend>

      <div className="color-swatches">
        {PALETTE.map((swatch) => (
          <label key={swatch.hex} className="color-swatch" title={swatch.name}>
            <input
              type="radio"
              name={id}
              value={swatch.hex}
              checked={hex === swatch.hex}
              onChange={() => onSelect(swatch.hex)}
              aria-label={swatch.name}
            />
            <span style={{ background: swatch.hex }} />
          </label>
        ))}
      </div>

      <div className="color-custom">
        <input
          type="color"
          value={hex ?? '#000000'}
          onChange={(event) => onSelect(event.target.value.toUpperCase())}
          aria-label={`${label} custom`}
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onCommit}
          onKeyDown={handleKeyDown}
          aria-label={`${label} HEX`}
          aria-invalid={error !== ''}
          aria-describedby={error ? errorId : undefined}
          style={error ? { borderColor: 'red' } : undefined}
          spellCheck={false}
        />
      </div>

      {error && (
        <p id={errorId} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  )
}
