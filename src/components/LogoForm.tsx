import { useMemo, useRef, useState } from 'react'
import { ImageField } from './ImageField'
import {
  DEFAULT_CLEAR_SPACE_UNIT,
  DEFAULT_GRID_MODULES,
  DEFAULT_GRID_X,
  DEFAULT_MARK_TYPES,
  GRID_MODULES,
  GRID_X_OPTIONS,
  MARK_TYPE_LABELS,
  MARK_TYPES,
} from '../data/logoCopy'
import { LOGO_PARTS } from '../data/manualSections'
import type { LogoParts } from '../data/manualSections'
import { keepInPlace } from '../utils/scrollAnchor'
import { validateImage, validatePositiveNumber } from '../utils/validation'
import { RULER_ERROR, parseRuler } from '../utils/rulers'
import { logoLayers } from '../utils/logoLayers'
import { NO_IMAGE, applyImage, chooseFile, isPending, shownFile, toImage, useLiveData } from '../utils/pendingImage'
import type { PendingImage } from '../utils/pendingImage'
import type { LogoData, MarkType } from '../types'

// What is typed in one part of a card (e.g. its Tagline). Everything is optional.
type PartDraft = {
  key: number
  label: string
  name: string
  role: string
  image: PendingImage
  fileError: string
  fromFile: File | null // the card's layered SVG it was made from: the card's Apply shows it too
}

// What is typed in the card of one mark type, with the parts it is built from.
// Everything is optional.
type CardDraft = {
  name: string
  role: string
  image: PendingImage
  fileError: string
  parts: PartDraft[]
  layersNote: string // what happened to the layers of the last SVG chosen, '' → nothing to say
}

const EMPTY_CARD: CardDraft = { name: '', role: '', image: NO_IMAGE, fileError: '', parts: [], layersNote: '' }

const MAX_PARTS = 4

// The hints of a layered SVG (see specs/logolayers.md)
const LAYERS_KEPT = 'Remove the parts of this card to use the layers of this SVG.'
const LAYERS_CUT = `Only the first ${MAX_PARTS} layers are used.`
const LAYERS_UNREADABLE = 'The layers of this SVG could not be read.'

// Suggestions for a part's label; any other label can be typed.
// The same double names as the mark types (Symbol = Isotype, Wordmark = Logotype).
const PART_LABELS = [MARK_TYPE_LABELS.Isotype, MARK_TYPE_LABELS.Logotype, 'Tagline']

// A part with nothing typed or chosen is left out of the preview.
function isEmptyPart(part: PartDraft) {
  return !part.label.trim() && !part.name.trim() && !part.role.trim() && !part.image.file
}

// `key` stays the same when other rows are removed, so React keeps each row's state.
type VariantRow = {
  key: number
  name: string
  usage: string
  image: PendingImage
  fileError: string
}

// Form of the Logo section, in four groups that match its four pages:
// Concept (Brand concept page), Anatomy (Anatomy page), Versions (Logo versions page) and
// Clear space & size (Clear space page). The versions work like the colors of the Colors section: an accordion.
// Groups whose part is off (see LOGO_PARTS) show "Coming soon" and send nothing.
// Every change reaches the preview at once; each new image waits for its own Apply (see
// docs/adr/0007 and 0020).
type LogoFormProps = {
  onChange?: (logo: LogoData) => void
  parts?: LogoParts
}

const MAX_VARIANTS = 4

function newVariant(key: number): VariantRow {
  return { key, name: '', usage: '', image: NO_IMAGE, fileError: '' }
}

// The applied image of a field, ready for the preview (null → none yet).
function appliedImage(image: PendingImage) {
  const file = shownFile(image)
  return file ? toImage(file) : null
}


export function LogoForm({ onChange, parts = LOGO_PARTS }: LogoFormProps) {
  const nextKey = useRef(1)
  // The last file chosen in each card: the layers of an older one, read late, are dropped
  const latestCardFile = useRef<Partial<Record<MarkType, File | null>>>({})
  const [brandName, setBrandName] = useState('')
  // The brand may use several kinds of mark (at least one); each chosen one gets a card.
  const [markTypes, setMarkTypes] = useState<MarkType[]>(DEFAULT_MARK_TYPES)
  // A card per mark type, kept while it is unticked so nothing typed is lost.
  const [cards, setCards] = useState<Partial<Record<MarkType, CardDraft>>>({})
  const [concept, setConcept] = useState('')
  const [variants, setVariants] = useState<VariantRow[]>(() => [newVariant(0)])
  const [openKey, setOpenKey] = useState<number | null>(0) // null → every version folded
  const [unit, setUnit] = useState(DEFAULT_CLEAR_SPACE_UNIT)
  const [minDigital, setMinDigital] = useState('32')
  const [minPrint, setMinPrint] = useState('15')
  // The last valid sizes: while a number is half typed or wrong, the page keeps these
  const [validMinDigital, setValidMinDigital] = useState(32)
  const [validMinPrint, setValidMinPrint] = useState(15)
  const [grid, setGrid] = useState(NO_IMAGE)
  const [gridModules, setGridModules] = useState<number>(DEFAULT_GRID_MODULES)
  const [gridX, setGridX] = useState<number>(DEFAULT_GRID_X)
  // The rulers as typed, and the last valid steps the page draws (see utils/rulers.ts)
  const [rulerTop, setRulerTop] = useState('')
  const [rulerSide, setRulerSide] = useState('')
  const [validRulerTop, setValidRulerTop] = useState<number[]>([])
  const [validRulerSide, setValidRulerSide] = useState<number[]>([])
  const [gridError, setGridError] = useState('')

  // The construction grid: an uploaded one (applied) replaces the one the app draws
  const gridInUse = parts.clearSpace && shownFile(grid) !== null
  const gridWaiting = isPending(grid, gridError)

  // Shown as soon as the value is wrong; a blank text field is not an error.
  const markTypesError = markTypes.length === 0 ? 'Choose at least one mark type' : ''
  const minDigitalError = minDigital.trim() ? validatePositiveNumber(minDigital) : ''
  const minPrintError = minPrint.trim() ? validatePositiveNumber(minPrint) : ''
  const rulerTopError = parseRuler(rulerTop) ? '' : RULER_ERROR
  const rulerSideError = parseRuler(rulerSide) ? '' : RULER_ERROR

  const logo = useMemo<LogoData>(
    () => ({
      brandName: brandName.trim(),
      concept: concept.trim(),
      marks: markTypes.map((type) => {
        const card = cards[type] ?? EMPTY_CARD
        return {
          type,
          name: card.name.trim(),
          role: card.role.trim(),
          image: appliedImage(card.image),
          parts: card.parts
            .filter((part) => !isEmptyPart(part))
            .map((part, index) => ({
              label: part.label.trim() || `Part ${index + 1}`,
              name: part.name.trim(),
              role: part.role.trim(),
              image: appliedImage(part.image),
            })),
        }
      }),
      // A part that is off sends nothing of its own (its page shows "Coming soon")
      variants: parts.versions
        ? variants.map((row) => ({
            id: row.key,
            name: row.name.trim(),
            usage: row.usage.trim(),
            image: appliedImage(row.image),
          }))
        : [],
      clearSpaceUnit: unit.trim(),
      minDigitalPx: validMinDigital,
      minPrintMm: validMinPrint,
      grid: parts.clearSpace ? appliedImage(grid) : null,
      gridModules,
      gridX,
      rulerTop: validRulerTop,
      rulerSide: validRulerSide,
    }),
    [brandName, concept, markTypes, cards, variants, unit, validMinDigital, validMinPrint, grid, gridModules, gridX, validRulerTop, validRulerSide, parts],
  )
  useLiveData(logo, onChange)

  // A size field: what is typed always shows; only a valid number reaches the page
  function sizeChange(setValue: (value: string) => void, setValid: (value: number) => void) {
    return (value: string) => {
      setValue(value)
      if (!validatePositiveNumber(value)) setValid(Number(value))
    }
  }

  // A ruler field: what is typed always shows; only a valid sequence reaches the page
  function rulerChange(setValue: (value: string) => void, setValid: (steps: number[]) => void) {
    return (value: string) => {
      setValue(value)
      const steps = parseRuler(value)
      if (steps) setValid(steps)
    }
  }

  function takeKey() {
    return nextKey.current++
  }

  function updateCard(type: MarkType, changes: Partial<CardDraft>) {
    setCards((prev) => ({ ...prev, [type]: { ...EMPTY_CARD, ...prev[type], ...changes } }))
  }

  // Ticked types keep the order of MARK_TYPES, so the cards always read the same way.
  function toggleMarkType(type: MarkType) {
    setMarkTypes((prev) =>
      prev.includes(type)
        ? prev.filter((item) => item !== type)
        : MARK_TYPES.filter((item) => item === type || prev.includes(item)),
    )
  }

  function updateVariant(key: number, changes: Partial<VariantRow>) {
    setVariants((prev) => prev.map((row) => (row.key === key ? { ...row, ...changes } : row)))
  }

  // A new version opens, and the one that was open folds (like Add color).
  function addVariant() {
    if (variants.length >= MAX_VARIANTS) return
    const key = takeKey()
    setVariants((prev) => [...prev, newVariant(key)])
    setOpenKey(key)
  }

  function removeVariant(key: number) {
    setVariants((prev) => (prev.length > 1 ? prev.filter((row) => row.key !== key) : prev))
    setOpenKey(null)
  }

  function toggleVariant(key: number) {
    setOpenKey((prev) => (prev === key ? null : key))
  }

  // Card images are optional: only a wrong file is an error, flagged as soon as it is chosen.
  // A valid one waits for the card's Apply.
  function chooseCardFile(type: MarkType, file: File | null) {
    const card = cards[type] ?? EMPTY_CARD
    const fileError = file ? validateImage(file) : ''
    updateCard(type, {
      image: chooseFile(card.image, file),
      fileError,
      layersNote: '',
    })
    latestCardFile.current[type] = file
    if (file && !fileError) void fillPartsFromLayers(type, file)
  }

  // A layered SVG gives a card with no parts one part per layer (see specs/logolayers.md).
  // The parts remember the file they came from, so the card's Apply shows them too; if it was
  // pressed while the file was still being read, they arrive already shown.
  async function fillPartsFromLayers(type: MarkType, file: File) {
    const result = await logoLayers(file, MAX_PARTS)
    if (result.kind === 'none' || latestCardFile.current[type] !== file) return
    setCards((prev) => {
      const card = { ...EMPTY_CARD, ...prev[type] }
      if (result.kind === 'unreadable') return { ...prev, [type]: { ...card, layersNote: LAYERS_UNREADABLE } }
      if (card.parts.length > 0) return { ...prev, [type]: { ...card, layersNote: LAYERS_KEPT } }
      const applied = card.image.shown === file
      const parts = result.parts.map(
        (part): PartDraft => ({
          key: takeKey(),
          label: part.label,
          name: '',
          role: '',
          image: applied ? { file: part.file, shown: part.file } : chooseFile(NO_IMAGE, part.file),
          fileError: '',
          fromFile: file,
        }),
      )
      return { ...prev, [type]: { ...card, parts, layersNote: result.total > MAX_PARTS ? LAYERS_CUT : '' } }
    })
  }

  function cardParts(type: MarkType) {
    return cards[type]?.parts ?? []
  }

  function addPart(type: MarkType) {
    const parts = cardParts(type)
    if (parts.length >= MAX_PARTS) return
    const part: PartDraft = { key: takeKey(), label: '', name: '', role: '', image: NO_IMAGE, fileError: '', fromFile: null }
    updateCard(type, { parts: [...parts, part] })
  }

  function removePart(type: MarkType, key: number) {
    updateCard(type, { parts: cardParts(type).filter((part) => part.key !== key) })
  }

  function updatePart(type: MarkType, key: number, changes: Partial<PartDraft>) {
    updateCard(type, {
      parts: cardParts(type).map((part) => (part.key === key ? { ...part, ...changes } : part)),
    })
  }

  // A file chosen by hand is the part's own: the card's Apply no longer shows it
  function choosePartFile(type: MarkType, part: PartDraft, file: File | null) {
    updatePart(type, part.key, {
      image: chooseFile(part.image, file),
      fileError: file ? validateImage(file) : '',
      fromFile: null,
    })
  }

  // A wrong file is flagged as soon as it is chosen. A valid one waits for its Apply.
  function chooseVariantFile(row: VariantRow, file: File | null) {
    updateVariant(row.key, {
      image: chooseFile(row.image, file),
      fileError: file ? validateImage(file) : '',
    })
  }

  // The construction grid is optional: only a wrong file is an error.
  function chooseGridFile(file: File | null) {
    setGrid((prev) => chooseFile(prev, file))
    setGridError(file ? validateImage(file) : '')
  }

  // Each Apply shows only its own image (ADR 0020). The card's also shows the parts made from
  // its layered SVG (specs/logolayers.md).
  function applyCard(type: MarkType) {
    setCards((prev) => {
      const card = { ...EMPTY_CARD, ...prev[type] }
      const file = card.image.file
      const parts = card.parts.map((part) =>
        file && part.fromFile === file ? { ...part, image: applyImage(part.image, part.fileError) } : part,
      )
      return { ...prev, [type]: { ...card, image: applyImage(card.image, card.fileError), parts } }
    })
  }

  function applyPart(type: MarkType, part: PartDraft) {
    updatePart(type, part.key, { image: applyImage(part.image, part.fileError) })
  }

  function applyVariant(row: VariantRow) {
    updateVariant(row.key, { image: applyImage(row.image, row.fileError) })
  }

  function applyGrid() {
    setGrid((prev) => applyImage(prev, gridError))
  }

  // Back to the grid the app draws. Removing is not a new image, so it shows at once.
  function removeGrid() {
    setGrid(NO_IMAGE)
    setGridError('')
  }

  // A text field with its label and error, like the fields of the Cover form.
  function textField(
    id: string,
    label: string,
    value: string,
    error: string,
    onChange: (value: string) => void,
    inputMode?: 'decimal',
    placeholder?: string,
  ) {
    return (
      <>
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error !== ''}
          aria-describedby={error ? `${id}-error` : undefined}
          style={error ? { borderColor: 'red' } : undefined}
        />
        {error && (
          <p id={`${id}-error`} role="alert">
            {error}
          </p>
        )}
      </>
    )
  }

  return (
    <form onSubmit={(event) => event.preventDefault()} noValidate aria-label="Logo">
      {/* data-area: which page each group fills (LOGO_AREA_PAGES), so it can come first */}
      <fieldset className="logo-form-group" data-area="concept">
        <legend>Concept</legend>

        {textField('logo-brand-name', 'Brand name', brandName, '', setBrandName)}

        <label htmlFor="logo-concept">Concept</label>
        <textarea
          id="logo-concept"
          rows={3}
          value={concept}
          placeholder="The idea behind the design"
          onChange={(event) => setConcept(event.target.value)}
        />

      </fieldset>

      <fieldset className="logo-form-group" data-area="anatomy">
        <legend>Anatomy</legend>

        {/* One or more kinds of mark; each ticked one gets a card below */}
        <fieldset
          className="segmented-control logo-mark-type"
          aria-describedby={markTypesError ? 'logo-mark-types-error' : undefined}
        >
          <legend>Mark type</legend>
          {MARK_TYPES.map((type) => (
            <label key={type}>
              <input
                type="checkbox"
                name="logo-mark-type"
                value={type}
                checked={markTypes.includes(type)}
                onChange={() => toggleMarkType(type)}
              />
              <span>{MARK_TYPE_LABELS[type]}</span>
            </label>
          ))}
        </fieldset>
        {markTypesError && (
          <p id="logo-mark-types-error" role="alert">
            {markTypesError}
          </p>
        )}
        <p className="logo-form-hint">
          Layered logo? Export it from Illustrator as SVG, with Object IDs: Layer Names and the text outlined, and
          each layer becomes a part.
        </p>

        <datalist id="logo-part-labels">
          {PART_LABELS.map((label) => (
            <option key={label} value={label} />
          ))}
        </datalist>

        {/* A card per ticked type: its image, its name and what it does (all optional) */}
        {markTypes.map((type) => {
          const card = cards[type] ?? EMPTY_CARD
          return (
            <fieldset key={type} className="logo-mark-card">
              <legend>{MARK_TYPE_LABELS[type]}</legend>
              <ImageField
                id={`logo-mark-${type}-image`}
                label={`${type} image (optional)`}
                hideLabel
                fileName={card.image.file?.name ?? null}
                error={card.fileError}
                onChange={(file) => chooseCardFile(type, file)}
                pending={isPending(card.image, card.fileError)}
                onApply={() => applyCard(type)}
              />
              {card.layersNote && (
                <p className="logo-form-hint" role="status">
                  {card.layersNote}
                </p>
              )}
              <div className="logo-mark-card-fields">
                <input
                  type="text"
                  aria-label={`${type} name`}
                  placeholder="Name, e.g. Lightning symbol"
                  value={card.name}
                  onChange={(event) => updateCard(type, { name: event.target.value })}
                />
                <input
                  type="text"
                  aria-label={`${type} role`}
                  placeholder="Role, e.g. Conveys energy"
                  value={card.role}
                  onChange={(event) => updateCard(type, { role: event.target.value })}
                />
              </div>

              {/* The parts it is built from, e.g. Isotype + Logotype + Tagline (optional) */}
              {card.parts.map((part, index) => {
                const partLabel = `${type} part ${index + 1}`
                return (
                  <fieldset key={part.key} className="logo-mark-part">
                    <legend>Part {index + 1}</legend>
                    <input
                      type="text"
                      aria-label={`${partLabel} label`}
                      placeholder="Label, e.g. Isotype, Tagline"
                      list="logo-part-labels"
                      value={part.label}
                      onChange={(event) => updatePart(type, part.key, { label: event.target.value })}
                    />
                    <ImageField
                      id={`logo-part-${part.key}-image`}
                      label={`${partLabel} image (optional)`}
                      hideLabel
                      fileName={part.image.file?.name ?? null}
                      error={part.fileError}
                      onChange={(file) => choosePartFile(type, part, file)}
                      pending={isPending(part.image, part.fileError)}
                      onApply={() => applyPart(type, part)}
                    />
                    <div className="logo-mark-card-fields">
                      <input
                        type="text"
                        aria-label={`${partLabel} name`}
                        placeholder="Name"
                        value={part.name}
                        onChange={(event) => updatePart(type, part.key, { name: event.target.value })}
                      />
                      <input
                        type="text"
                        aria-label={`${partLabel} role`}
                        placeholder="Role"
                        value={part.role}
                        onChange={(event) => updatePart(type, part.key, { role: event.target.value })}
                      />
                    </div>
                    <button
                      type="button"
                      className="palette-secondary-button"
                      aria-label={`Remove ${partLabel}`}
                      onClick={() => removePart(type, part.key)}
                    >
                      Remove
                    </button>
                  </fieldset>
                )
              })}
              <button
                type="button"
                className="palette-secondary-button"
                aria-label={`Add part to ${type}`}
                disabled={card.parts.length >= MAX_PARTS}
                onClick={() => addPart(type)}
              >
                Add part
              </button>
            </fieldset>
          )
        })}
      </fieldset>

      <fieldset className="logo-form-group" data-area="versions" disabled={!parts.versions}>
        <legend>Versions</legend>
        {!parts.versions ? (
          <span className="manual-section-badge logo-form-soon">Coming soon</span>
        ) : (
          <>
            {variants.map((row, index) => {
              const label = `Version ${index + 1}`
              const id = `logo-version-${row.key}`
              const isOpen = openKey === row.key
              const bodyId = `${id}-body`
              const summaryId = `${id}-summary`
              return (
                <div
                  key={row.key}
                  className="palette-block"
                  data-open={isOpen}
                  data-invalid={Boolean(row.fileError)}
                >
                  {/* Folded or open, this row always shows the version's name and its file */}
                  <button
                    type="button"
                    className="palette-block-header"
                    aria-expanded={isOpen}
                    aria-controls={bodyId}
                    aria-label={label}
                    aria-describedby={summaryId}
                    onClick={(event) => {
                      keepInPlace(event.currentTarget) // the version above may fold
                      toggleVariant(row.key)
                    }}
                  >
                    <span className="palette-block-title">
                      {label}
                      {index === 0 && <span className="logo-primary-tag"> · Primary</span>}
                    </span>
                    <span id={summaryId} className="palette-block-summary">
                      <span className="palette-block-name">{row.name.trim() || 'No name yet'}</span>
                      <span className="palette-block-name logo-version-file">
                        {row.image.file?.name ?? 'No image'}
                      </span>
                    </span>
                    <span className="palette-block-chevron" aria-hidden="true" />
                  </button>

                  {/* Always in the page so it can fold and unfold; inert while folded */}
                  <div id={bodyId} className="palette-block-body" inert={!isOpen}>
                    <div className="palette-block-inner">
                      {textField(`${id}-name`, `${label} name`, row.name, '', (value) =>
                        updateVariant(row.key, { name: value }),
                      )}
                      {textField(`${id}-usage`, `${label} use for`, row.usage, '', (value) =>
                        updateVariant(row.key, { usage: value }),
                      )}
                      <ImageField
                        id={`${id}-image`}
                        label={`${label} image`}
                        fileName={row.image.file?.name ?? null}
                        error={row.fileError}
                        onChange={(file) => chooseVariantFile(row, file)}
                        pending={isPending(row.image, row.fileError)}
                        onApply={() => applyVariant(row)}
                      />
                      {variants.length > 1 && (
                        <button
                          type="button"
                          className="palette-secondary-button"
                          onClick={() => removeVariant(row.key)}
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
                keepInPlace(event.currentTarget) // the open version above folds
                addVariant()
              }}
              disabled={variants.length >= MAX_VARIANTS}
            >
              Add version
            </button>
          </>
        )}
      </fieldset>

      <fieldset className="logo-form-group" data-area="clearSpace" disabled={!parts.clearSpace}>
        <legend>Clear space & size</legend>
        {!parts.clearSpace ? (
          <span className="manual-section-badge logo-form-soon">Coming soon</span>
        ) : (
          <>
            {textField('logo-unit', 'Unit X', unit, '', setUnit)}
            {textField(
              'logo-min-digital',
              'Min digital size (px)',
              minDigital,
              minDigitalError,
              sizeChange(setMinDigital, setValidMinDigital),
              'decimal',
            )}
            {textField(
              'logo-min-print',
              'Min print size (mm)',
              minPrint,
              minPrintError,
              sizeChange(setMinPrint, setValidMinPrint),
              'decimal',
            )}
            {/* The grid the app draws needs no upload: it uses the Cover logo (or Version 1).
                An uploaded grid replaces it, so the density is off while one is shown. */}
            <fieldset className="segmented-control logo-size-control" disabled={gridInUse}>
              <legend>Grid modules</legend>
              {GRID_MODULES.map((count) => (
                <label key={count}>
                  <input
                    type="radio"
                    name="logo-grid-modules"
                    value={count}
                    checked={gridModules === count}
                    onChange={() => setGridModules(count)}
                  />
                  <span>{count}</span>
                </label>
              ))}
            </fieldset>
            {/* X sets the clear space (3.1) and the grid margin (3.2), so it works with an
                uploaded grid too */}
            <fieldset className="segmented-control logo-size-control">
              <legend>X (modules)</legend>
              {GRID_X_OPTIONS.map((size) => (
                <label key={size}>
                  <input
                    type="radio"
                    name="logo-grid-x"
                    value={size}
                    checked={gridX === size}
                    onChange={() => setGridX(size)}
                  />
                  <span>{size}</span>
                </label>
              ))}
            </fieldset>
            {textField(
              'logo-ruler-top',
              'Top ruler',
              rulerTop,
              rulerTopError,
              rulerChange(setRulerTop, setValidRulerTop),
              undefined,
              'e.g. X 1.5X X 1.5X X',
            )}
            {textField(
              'logo-ruler-side',
              'Side ruler',
              rulerSide,
              rulerSideError,
              rulerChange(setRulerSide, setValidRulerSide),
              undefined,
              'e.g. X 1.5X X',
            )}
            <p className="logo-form-hint" id="logo-grid-hint">
              {gridInUse
                ? 'Your uploaded grid is shown. Remove it to use the grid drawn from your logo.'
                : gridWaiting
                  ? 'Click Apply to show this grid instead of the one drawn from your logo.'
                  : 'Drawn from your logo (Cover or Version 1). No upload needed.'}
            </p>
            <ImageField
              id="logo-grid"
              label="Construction grid (optional)"
              fileName={grid.file?.name ?? null}
              error={gridError}
              onChange={chooseGridFile}
              pending={gridWaiting}
              onApply={applyGrid}
            />
            {(grid.file || grid.shown) && (
              <button type="button" className="palette-secondary-button" onClick={removeGrid}>
                Remove grid
              </button>
            )}
          </>
        )}
      </fieldset>
    </form>
  )
}
