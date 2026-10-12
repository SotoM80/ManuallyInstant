import { useCallback, useId, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react'
import { PALETTE, normalizeHex } from '../data/colorPalette'
import { RgbPopover } from './RgbPopover'
import { useDismiss } from '../utils/useDismiss'
import '../css/ColorPicker.css'

type ColorPickerProps = {
  label: string
  value: string // what is in the HEX field, valid or not
  error: string
  onChange: (value: string) => void // every keystroke in the HEX field
  onSelect: (hex: string) => void // a swatch or the custom picker: always a valid "#RRGGBB"
  onCommit: () => void // blur or Enter in the HEX field
}

// The custom picker swells gently when a swatch is chosen, to show it took that color.
// Web Animations (not CSS) because the same element must animate again on every pick.
function nudge(element: HTMLElement | null) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  element?.animate?.(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }],
    { duration: 520, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
  )
}

// Quick swatches + any color (native picker and HEX field), all kept in sync.
// The swatches start hidden behind one circle with the current color; a click opens them
// in a floating pop-up under the circle, so the rest of the form never moves.
export function ColorPicker({ label, value, error, onChange, onSelect, onCommit }: ColorPickerProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hex = normalizeHex(value)
  const customRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const swatchesId = `${id}-swatches`
  const rootRef = useRef<HTMLFieldSetElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Closing gives the focus back to the circle, unless the user clicked somewhere else
  const close = useCallback(() => {
    if (rootRef.current?.contains(document.activeElement)) toggleRef.current?.focus()
    setOpen(false)
  }, [])
  useDismiss(rootRef, open, close)

  // A mouse click on a swatch folds them back. Arrow keys also "click" the radios
  // (with detail 0), and those keep the fan open so the keyboard can keep browsing.
  // The focus always goes back to the circle: some browsers (Safari) never focus the radio.
  function handleSwatchClick(event: MouseEvent<HTMLInputElement>) {
    if (event.detail === 0) return
    toggleRef.current?.focus()
    setOpen(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    onCommit()
  }

  return (
    <fieldset className="color-picker" ref={rootRef}>
      <legend>{label}</legend>

      <div className="color-custom">
        {/* Anchors the floating swatches to the circle */}
        <div className="color-swatches-anchor">
          <button
            ref={toggleRef}
            type="button"
            className="color-swatches-toggle"
            aria-expanded={open}
            aria-controls={swatchesId}
            aria-label={`${label} swatches`}
            onClick={() => setOpen((wasOpen) => !wasOpen)}
            data-empty={!hex}
            style={hex ? { background: hex } : undefined}
          />

          {/* Always in the page so it can animate in and out; inert while closed */}
          <div id={swatchesId} className="color-swatches" data-open={open} inert={!open}>
            {/* --i staggers the swatches: they fade in one after the other */}
            {PALETTE.map((swatch, index) => (
              <label key={swatch.hex} className="color-swatch" style={{ '--i': index } as CSSProperties}>
                <input
                  type="radio"
                  name={id}
                  value={swatch.hex}
                  checked={hex === swatch.hex}
                  onChange={() => {
                    onSelect(swatch.hex)
                    nudge(customRef.current)
                  }}
                  onClick={handleSwatchClick}
                  aria-label={swatch.name}
                />
                <span style={{ background: swatch.hex }} />
                {/* Pop-up with the name and HEX; the radio's aria-label already says the name */}
                <span className="color-swatch-tip" aria-hidden="true">
                  {swatch.name} <code>{swatch.hex}</code>
                </span>
              </label>
            ))}
          </div>
        </div>
        <input
          ref={customRef}
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
        <RgbPopover label={label} hex={hex} onSelect={onSelect} />
      </div>

      {error && (
        <p id={errorId} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  )
}
