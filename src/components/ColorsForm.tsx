import { useMemo } from 'react'
import { ColorPicker } from './ColorPicker'
import { useCmyk } from '../utils/cmykValues'
import { INVALID_HEX_MESSAGE, PALETTE, colorValues, normalizeHex } from '../data/colorPalette'
import { keepInPlace } from '../utils/scrollAnchor'
import { useLiveData } from '../utils/pendingImage'
import { useDraft } from '../utils/useDraft'
import type { PaletteColor } from '../types'

// One block of the form: what is typed (valid or not) and its errors.
// `key` stays the same when other colors are removed, so React keeps each block's state.
type ColorRow = {
  key: number
  name: string
  hex: string
  validHex: string // the last valid HEX: while the field is half typed, the preview keeps it
  hexError: string
}

// Form of the Colors section: 1 to 6 colors, each with a name and a color picker.
// The colors work like an accordion: only one is open, the others are folded into a
// short row (chip, name and HEX) that opens it with a click. Every change reaches the preview at once.
type ColorsFormProps = {
  onChange?: (palette: PaletteColor[]) => void
  // Optional owner of the form's fields (see useDraft)
  draft?: ColorsDraft
  onDraftChange?: (draft: ColorsDraft) => void
  // The outline of the Color palette page's chips (kept in the Skin, ADR 0034); on by default
  chipOutline?: boolean
  onChipOutlineChange?: (on: boolean) => void
}

// Everything the form shows. `nextKey` is kept too: a row's key is its color's id in the
// palette (the skin copies colors by id), so a color added later must never reuse one.
export type ColorsDraft = {
  rows: ColorRow[]
  openKey: number | null // null → every color folded
  nextKey: number
}

const MAX_COLORS = 6

// New colors start at the first quick swatch not used yet (6 colors never use up the 12).
function firstUnusedSwatch(rows: ColorRow[]) {
  const used = new Set(rows.map((row) => normalizeHex(row.hex)))
  return (PALETTE.find((swatch) => !used.has(swatch.hex)) ?? PALETTE[0]).hex
}

function newRow(key: number, rows: ColorRow[]): ColorRow {
  const hex = firstUnusedSwatch(rows)
  return { key, name: '', hex, validHex: hex, hexError: '' }
}

const NO_COLORS_DRAFT: ColorsDraft = { rows: [newRow(0, [])], openKey: 0, nextKey: 1 }

export function ColorsForm({
  onChange,
  draft: ownerDraft,
  onDraftChange,
  chipOutline = true,
  onChipOutlineChange = () => {},
}: ColorsFormProps) {
  const [draft, update, current] = useDraft(NO_COLORS_DRAFT, ownerDraft, onDraftChange)
  const { rows, openKey } = draft
  const { valuesOf } = useCmyk()

  const palette = useMemo(
    () => rows.map((row) => ({ id: row.key, name: row.name.trim(), hex: row.validHex })),
    [rows],
  )
  useLiveData(palette, onChange)

  function updateRow(key: number, changes: Partial<ColorRow>) {
    update((prev) => ({ rows: prev.rows.map((row) => (row.key === key ? { ...row, ...changes } : row)) }))
  }

  // A new color opens, and the one that was open folds.
  function addColor() {
    update((prev) =>
      prev.rows.length >= MAX_COLORS
        ? {}
        : { rows: [...prev.rows, newRow(prev.nextKey, prev.rows)], openKey: prev.nextKey, nextKey: prev.nextKey + 1 },
    )
  }

  function removeColor(key: number) {
    update((prev) => ({
      rows: prev.rows.length > 1 ? prev.rows.filter((row) => row.key !== key) : prev.rows,
      openKey: null,
    }))
  }

  // Opening a color folds the open one; clicking the open one folds it.
  function toggleColor(key: number) {
    update((prev) => ({ openKey: prev.openKey === key ? null : key }))
  }

  // Typing or picking a color: a valid HEX also becomes the one the preview shows.
  function updateHex(key: number, value: string) {
    const hex = normalizeHex(value)
    updateRow(key, hex ? { hex: value, validHex: hex, hexError: '' } : { hex: value, hexError: '' })
  }

  // On blur or Enter in the HEX field: tidy a valid value, flag the rest (same rule as the Cover).
  function commitHex(shown: ColorRow) {
    const row = current().rows.find((item) => item.key === shown.key) ?? shown
    if (row.hex.trim() === '') return
    const hex = normalizeHex(row.hex)
    updateRow(row.key, { hex: hex ?? row.hex, hexError: hex ? '' : INVALID_HEX_MESSAGE })
  }

  return (
    <form onSubmit={(event) => event.preventDefault()} noValidate aria-label="Colors">
      {rows.map((row, index) => {
        // Labels follow the position: removing Color 2 turns Color 3 into Color 2.
        const label = `Color ${index + 1}`
        const nameId = `palette-color-${row.key}-name`
        const hex = normalizeHex(row.hex)
        const cmyk = hex ? valuesOf(hex) : null
        const values = hex && cmyk ? colorValues(hex, cmyk.cmyk) : null
        const isOpen = openKey === row.key
        const bodyId = `palette-color-${row.key}-body`
        const summaryId = `palette-color-${row.key}-summary`
        return (
          <div
            key={row.key}
            className="palette-block"
            data-open={isOpen}
            data-invalid={Boolean(row.hexError)}
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
                  onChange={(event) => updateRow(row.key, { name: event.target.value })}
                />

                <ColorPicker
                  label={label}
                  value={row.hex}
                  error={row.hexError}
                  onChange={(value) => updateHex(row.key, value)}
                  onSelect={(value) => updateHex(row.key, value)}
                  onCommit={() => commitHex(row)}
                />

                <p className="palette-block-values">
                  <span>HEX {values?.hex ?? '—'}</span>
                  <span>RGB {values?.rgb ?? '—'}</span>
                  <span>
                    {cmyk?.exact ? 'CMYK' : 'CMYK ≈'} {values?.cmyk ?? '—'}
                  </span>
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

      {/* Only the page's chips: the form's own chips keep their look (specs/colorpalette.md) */}
      <label className="skin-check palette-chip-outline">
        <input
          type="checkbox"
          checked={chipOutline}
          onChange={(event) => onChipOutlineChange(event.target.checked)}
        />
        Chip outline
      </label>
    </form>
  )
}
