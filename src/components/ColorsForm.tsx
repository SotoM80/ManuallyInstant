import { useRef, useState } from 'react'
import type { AnimationEvent, FormEvent } from 'react'
import { ColorPicker } from './ColorPicker'
import { INVALID_HEX_MESSAGE, PALETTE, colorValues, normalizeHex } from '../data/colorPalette'
import { keepInPlace } from '../utils/scrollAnchor'
import { validateColor, validateText } from '../utils/validation'
import type { PaletteColor } from '../types'

// What the Save button shows after a click: a pulse with a check, or a shake.
type SaveFeedback = 'idle' | 'saved' | 'error'

// One block of the form: what is typed (valid or not) and its errors.
// `key` stays the same when other colors are removed, so React keeps each block's state.
type ColorRow = {
  key: number
  name: string
  hex: string
  nameError: string
  hexError: string
}

// Form of the Colors section: 1 to 6 colors, each with a name and a color picker.
// The colors work like an accordion: only one is open, the others are folded into a
// short row (chip, name and HEX) that opens it with a click.
type ColorsFormProps = {
  onSubmit?: (palette: PaletteColor[]) => void
}

const MAX_COLORS = 6

// New colors start at the first quick swatch not used yet (6 colors never use up the 12).
function firstUnusedSwatch(rows: ColorRow[]) {
  const used = new Set(rows.map((row) => normalizeHex(row.hex)))
  return (PALETTE.find((swatch) => !used.has(swatch.hex)) ?? PALETTE[0]).hex
}

function newRow(key: number, rows: ColorRow[]): ColorRow {
  return { key, name: '', hex: firstUnusedSwatch(rows), nameError: '', hexError: '' }
}

export function ColorsForm({ onSubmit }: ColorsFormProps) {
  const nextKey = useRef(1)
  const [rows, setRows] = useState<ColorRow[]>(() => [newRow(0, [])])
  const [openKey, setOpenKey] = useState<number | null>(0) // null → every color folded
  const [feedback, setFeedback] = useState<SaveFeedback>('idle')

  function updateRow(key: number, changes: Partial<ColorRow>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...changes } : row)))
  }

  // A new color opens, and the one that was open folds.
  function addColor() {
    if (rows.length >= MAX_COLORS) return
    const key = nextKey.current++
    setRows((prev) => [...prev, newRow(key, prev)])
    setOpenKey(key)
  }

  function removeColor(key: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.key !== key) : prev))
    setOpenKey(null)
  }

  // Opening a color folds the open one; clicking the open one folds it.
  function toggleColor(key: number) {
    setOpenKey((prev) => (prev === key ? null : key))
  }

  // On blur or Enter in the HEX field: tidy a valid value, flag the rest (same rule as the Cover).
  function commitHex(row: ColorRow) {
    if (row.hex.trim() === '') return
    const hex = normalizeHex(row.hex)
    updateRow(row.key, { hex: hex ?? row.hex, hexError: hex ? '' : INVALID_HEX_MESSAGE })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const checked = rows.map((row) => ({
      ...row,
      nameError: validateText(row.name),
      hexError: validateColor(row.hex),
    }))
    setRows(checked)
    const firstInvalid = checked.find((row) => row.nameError || row.hexError)
    if (firstInvalid) {
      setOpenKey(firstInvalid.key) // so its error can be seen
      setFeedback('error')
      return
    }

    onSubmit?.(rows.map((row) => ({ name: row.name.trim(), hex: normalizeHex(row.hex) as string })))
    setFeedback('saved')
  }

  // Back to idle when the button's own animation ends, so the next Save animates again.
  function handleFeedbackEnd(event: AnimationEvent<HTMLButtonElement>) {
    if (!event.pseudoElement) setFeedback('idle')
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Colors">
      {rows.map((row, index) => {
        // Labels follow the position: removing Color 2 turns Color 3 into Color 2.
        const label = `Color ${index + 1}`
        const nameId = `palette-color-${row.key}-name`
        const hex = normalizeHex(row.hex)
        const values = hex ? colorValues(hex) : null
        const isOpen = openKey === row.key
        const bodyId = `palette-color-${row.key}-body`
        const summaryId = `palette-color-${row.key}-summary`
        return (
          <div
            key={row.key}
            className="palette-block"
            data-open={isOpen}
            data-invalid={Boolean(row.nameError || row.hexError)}
          >
            {/* Folded or open, this row always shows the color, its name and its HEX */}
            <button
              type="button"
              className="palette-block-header"
              aria-expanded={isOpen}
              aria-controls={bodyId}
              aria-label={label}
              aria-describedby={summaryId}
              onClick={(event) => {
                keepInPlace(event.currentTarget) // the color above may fold
                toggleColor(row.key)
              }}
            >
              <span
                className="palette-block-chip"
                data-empty={!hex}
                style={hex ? { background: hex } : undefined}
              />
              <span className="palette-block-title">{label}</span>
              <span id={summaryId} className="palette-block-summary">
                <span className="palette-block-name">{row.name.trim() || 'No name yet'}</span>
                <span className="palette-block-hex">{hex ?? '—'}</span>
              </span>
              <span className="palette-block-chevron" aria-hidden="true" />
            </button>

            {/* Always in the page so it can fold and unfold; inert while folded */}
            <div id={bodyId} className="palette-block-body" inert={!isOpen}>
              <div className="palette-block-inner">
                <label htmlFor={nameId}>{label} name</label>
                <input
                  id={nameId}
                  type="text"
                  value={row.name}
                  onChange={(event) => updateRow(row.key, { name: event.target.value, nameError: '' })}
                  aria-invalid={row.nameError !== ''}
                  aria-describedby={row.nameError ? `${nameId}-error` : undefined}
                  style={row.nameError ? { borderColor: 'red' } : undefined}
                />
                {row.nameError && (
                  <p id={`${nameId}-error`} role="alert">
                    {row.nameError}
                  </p>
                )}

                <ColorPicker
                  label={label}
                  value={row.hex}
                  error={row.hexError}
                  onChange={(value) => updateRow(row.key, { hex: value, hexError: '' })}
                  onSelect={(value) => updateRow(row.key, { hex: value, hexError: '' })}
                  onCommit={() => commitHex(row)}
                />

                <p className="palette-block-values">
                  <span>HEX {values?.hex ?? '—'}</span>
                  <span>RGB {values?.rgb ?? '—'}</span>
                  <span>CMYK ≈ {values?.cmyk ?? '—'}</span>
                </p>

                {rows.length > 1 && (
                  <button
                    type="button"
                    className="palette-secondary-button"
                    onClick={() => removeColor(row.key)}
                    aria-label={`Remove ${label}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}

      <button
        type="button"
        className="palette-secondary-button"
        onClick={(event) => {
          keepInPlace(event.currentTarget) // the open color above folds
          addColor()
        }}
        disabled={rows.length >= MAX_COLORS}
      >
        Add color
      </button>

      <button type="submit" data-feedback={feedback} onAnimationEnd={handleFeedbackEnd}>
        Save
      </button>
    </form>
  )
}
