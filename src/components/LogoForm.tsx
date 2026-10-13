import { useRef, useState } from 'react'
import type { AnimationEvent, FormEvent } from 'react'
import { ImageField } from './ImageField'
import { DEFAULT_MARK_TYPES, MARK_TYPES } from '../data/logoCopy'
import { LOGO_PARTS } from '../data/manualSections'
import type { LogoParts } from '../data/manualSections'
import { keepInPlace } from '../utils/scrollAnchor'
import { validateImage, validatePositiveNumber, validateText } from '../utils/validation'
import type { LogoData, MarkType, UploadedImage } from '../types'

// What the Save button shows after a click: a pulse with a check, or a shake.
type SaveFeedback = 'idle' | 'saved' | 'error'

// What is typed in one part of a card (e.g. its Tagline). Everything is optional.
type PartDraft = {
  key: number
  label: string
  name: string
  role: string
  file: File | null
  fileError: string
}

// What is typed in the card of one mark type, with the parts it is built from.
// Everything is optional.
type CardDraft = {
  name: string
  role: string
  file: File | null
  fileError: string
  parts: PartDraft[]
}

const EMPTY_CARD: CardDraft = { name: '', role: '', file: null, fileError: '', parts: [] }

const MAX_PARTS = 4

// Suggestions for a part's label; any other label can be typed.
const PART_LABELS = ['Isotype', 'Logotype', 'Symbol', 'Wordmark', 'Tagline']

// A part with nothing typed or chosen is left out when saving.
function isEmptyPart(part: PartDraft) {
  return !part.label.trim() && !part.name.trim() && !part.role.trim() && !part.file
}

// `key` stays the same when other rows are removed, so React keeps each row's state.
type VariantRow = {
  key: number
  name: string
  usage: string
  file: File | null
  nameError: string
  usageError: string
  fileError: string
}

// Form of the Logo section, in four groups that match its four pages:
// Concept (Brand concept page), Anatomy (Anatomy page), Versions (Logo versions page) and
// Clear space & size (Clear space page). The versions work like the colors of the Colors section: an accordion.
// Groups whose part is off (see LOGO_PARTS) show "Coming soon" and are not checked.
type LogoFormProps = {
  onSubmit?: (logo: LogoData) => void
  parts?: LogoParts
}

const MAX_VARIANTS = 4

function newVariant(key: number): VariantRow {
  return { key, name: '', usage: '', file: null, nameError: '', usageError: '', fileError: '' }
}

function toImage(file: File): UploadedImage {
  return { url: URL.createObjectURL(file), name: file.name }
}

export function LogoForm({ onSubmit, parts = LOGO_PARTS }: LogoFormProps) {
  const nextKey = useRef(1)
  const [brandName, setBrandName] = useState('')
  const [brandNameError, setBrandNameError] = useState('')
  // The brand may use several kinds of mark (at least one); each chosen one gets a card.
  const [markTypes, setMarkTypes] = useState<MarkType[]>(DEFAULT_MARK_TYPES)
  const [markTypesError, setMarkTypesError] = useState('')
  // A card per mark type, kept while it is unticked so nothing typed is lost.
  const [cards, setCards] = useState<Partial<Record<MarkType, CardDraft>>>({})
  const [concept, setConcept] = useState('')
  const [conceptError, setConceptError] = useState('')
  const [variants, setVariants] = useState<VariantRow[]>(() => [newVariant(0)])
  const [openKey, setOpenKey] = useState<number | null>(0) // null → every version folded
  const [unit, setUnit] = useState('the height of the letter X')
  const [unitError, setUnitError] = useState('')
  const [minDigital, setMinDigital] = useState('32')
  const [minDigitalError, setMinDigitalError] = useState('')
  const [minPrint, setMinPrint] = useState('15')
  const [minPrintError, setMinPrintError] = useState('')
  const [gridFile, setGridFile] = useState<File | null>(null)
  const [gridError, setGridError] = useState('')
  const [feedback, setFeedback] = useState<SaveFeedback>('idle')

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
    setMarkTypesError('')
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
  function chooseCardFile(type: MarkType, file: File | null) {
    updateCard(type, { file, fileError: file ? validateImage(file) : '' })
  }

  function cardParts(type: MarkType) {
    return cards[type]?.parts ?? []
  }

  function addPart(type: MarkType) {
    const parts = cardParts(type)
    if (parts.length >= MAX_PARTS) return
    const part: PartDraft = { key: takeKey(), label: '', name: '', role: '', file: null, fileError: '' }
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

  function choosePartFile(type: MarkType, key: number, file: File | null) {
    updatePart(type, key, { file, fileError: file ? validateImage(file) : '' })
  }

  // A wrong file is flagged as soon as it is chosen, not only on submit.
  function chooseVariantFile(key: number, file: File | null) {
    updateVariant(key, { file, fileError: file ? validateImage(file) : '' })
  }

  // The construction grid is optional: only a wrong file is an error.
  function chooseGridFile(file: File | null) {
    setGridFile(file)
    setGridError(file ? validateImage(file) : '')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextBrandNameError = validateText(brandName)
    const nextConceptError = validateText(concept)
    const nextMarkTypesError = markTypes.length === 0 ? 'Choose at least one mark type' : ''
    const cardsInvalid = markTypes.some(
      (type) => cards[type]?.fileError || cardParts(type).some((part) => part.fileError),
    )
    const checkedVariants = parts.versions
      ? variants.map((row) => ({
          ...row,
          nameError: validateText(row.name),
          usageError: validateText(row.usage),
          fileError: validateImage(row.file),
        }))
      : variants
    const nextUnitError = parts.clearSpace ? validateText(unit) : ''
    const nextMinDigitalError = parts.clearSpace ? validatePositiveNumber(minDigital) : ''
    const nextMinPrintError = parts.clearSpace ? validatePositiveNumber(minPrint) : ''
    const nextGridError = parts.clearSpace && gridFile ? validateImage(gridFile) : ''

    setBrandNameError(nextBrandNameError)
    setConceptError(nextConceptError)
    setMarkTypesError(nextMarkTypesError)
    setVariants(checkedVariants)
    setUnitError(nextUnitError)
    setMinDigitalError(nextMinDigitalError)
    setMinPrintError(nextMinPrintError)
    setGridError(nextGridError)

    const firstInvalidVariant = checkedVariants.find(
      (row) => row.nameError || row.usageError || row.fileError,
    )
    const invalid =
      nextBrandNameError ||
      nextConceptError ||
      nextMarkTypesError ||
      cardsInvalid ||
      firstInvalidVariant ||
      nextUnitError ||
      nextMinDigitalError ||
      nextMinPrintError ||
      nextGridError
    if (invalid) {
      if (firstInvalidVariant) setOpenKey(firstInvalidVariant.key) // so its error can be seen
      setFeedback('error')
      return
    }

    onSubmit?.({
      brandName: brandName.trim(),
      concept: concept.trim(),
      marks: markTypes.map((type) => {
        const card = cards[type] ?? EMPTY_CARD
        return {
          type,
          name: card.name.trim(),
          role: card.role.trim(),
          image: card.file ? toImage(card.file) : null,
          parts: card.parts
            .filter((part) => !isEmptyPart(part))
            .map((part, index) => ({
              label: part.label.trim() || `Part ${index + 1}`,
              name: part.name.trim(),
              role: part.role.trim(),
              image: part.file ? toImage(part.file) : null,
            })),
        }
      }),
      // A part that is off saves nothing of its own (its page shows "Coming soon")
      variants: parts.versions
        ? variants.map((row) => ({
            name: row.name.trim(),
            usage: row.usage.trim(),
            image: toImage(row.file as File),
          }))
        : [],
      clearSpaceUnit: unit.trim(),
      minDigitalPx: Number(minDigital),
      minPrintMm: Number(minPrint),
      grid: parts.clearSpace && gridFile ? toImage(gridFile) : null,
    })
    setFeedback('saved')
  }

  // Back to idle when the button's own animation ends, so the next Save animates again.
  function handleFeedbackEnd(event: AnimationEvent<HTMLButtonElement>) {
    if (!event.pseudoElement) setFeedback('idle')
  }

  // A text field with its label and error, like the fields of the Cover form.
  function textField(
    id: string,
    label: string,
    value: string,
    error: string,
    onChange: (value: string) => void,
    inputMode?: 'decimal',
  ) {
    return (
      <>
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          type="text"
          inputMode={inputMode}
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
    <form onSubmit={handleSubmit} noValidate aria-label="Logo">
      <fieldset className="logo-form-group">
        <legend>Concept</legend>

        {textField('logo-brand-name', 'Brand name', brandName, brandNameError, (value) => {
          setBrandName(value)
          setBrandNameError('')
        })}

        <label htmlFor="logo-concept">Concept</label>
        <textarea
          id="logo-concept"
          rows={3}
          value={concept}
          placeholder="The idea behind the design"
          onChange={(event) => {
            setConcept(event.target.value)
            setConceptError('')
          }}
          aria-invalid={conceptError !== ''}
          aria-describedby={conceptError ? 'logo-concept-error' : undefined}
          style={conceptError ? { borderColor: 'red' } : undefined}
        />
        {conceptError && (
          <p id="logo-concept-error" role="alert">
            {conceptError}
          </p>
        )}

      </fieldset>

      <fieldset className="logo-form-group">
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
              <span>{type}</span>
            </label>
          ))}
        </fieldset>
        {markTypesError && (
          <p id="logo-mark-types-error" role="alert">
            {markTypesError}
          </p>
        )}

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
              <legend>{type}</legend>
              <ImageField
                id={`logo-mark-${type}-image`}
                label={`${type} image (optional)`}
                hideLabel
                fileName={card.file?.name ?? null}
                error={card.fileError}
                onChange={(file) => chooseCardFile(type, file)}
              />
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
                      fileName={part.file?.name ?? null}
                      error={part.fileError}
                      onChange={(file) => choosePartFile(type, part.key, file)}
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

      <fieldset className="logo-form-group" disabled={!parts.versions}>
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
                  data-invalid={Boolean(row.nameError || row.usageError || row.fileError)}
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
                        {row.file?.name ?? 'No image'}
                      </span>
                    </span>
                    <span className="palette-block-chevron" aria-hidden="true" />
                  </button>

                  {/* Always in the page so it can fold and unfold; inert while folded */}
                  <div id={bodyId} className="palette-block-body" inert={!isOpen}>
                    <div className="palette-block-inner">
                      {textField(`${id}-name`, `${label} name`, row.name, row.nameError, (value) =>
                        updateVariant(row.key, { name: value, nameError: '' }),
                      )}
                      {textField(`${id}-usage`, `${label} use for`, row.usage, row.usageError, (value) =>
                        updateVariant(row.key, { usage: value, usageError: '' }),
                      )}
                      <ImageField
                        id={`${id}-image`}
                        label={`${label} image`}
                        fileName={row.file?.name ?? null}
                        error={row.fileError}
                        onChange={(file) => chooseVariantFile(row.key, file)}
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

      <fieldset className="logo-form-group" disabled={!parts.clearSpace}>
        <legend>Clear space & size</legend>
        {!parts.clearSpace ? (
          <span className="manual-section-badge logo-form-soon">Coming soon</span>
        ) : (
          <>
            {textField('logo-unit', 'Unit X', unit, unitError, (value) => {
              setUnit(value)
              setUnitError('')
            })}
            {textField(
              'logo-min-digital',
              'Min digital size (px)',
              minDigital,
              minDigitalError,
              (value) => {
                setMinDigital(value)
                setMinDigitalError('')
              },
              'decimal',
            )}
            {textField(
              'logo-min-print',
              'Min print size (mm)',
              minPrint,
              minPrintError,
              (value) => {
                setMinPrint(value)
                setMinPrintError('')
              },
              'decimal',
            )}
            <ImageField
              id="logo-grid"
              label="Construction grid (optional)"
              fileName={gridFile?.name ?? null}
              error={gridError}
              onChange={chooseGridFile}
            />
          </>
        )}
      </fieldset>

      <button type="submit" data-feedback={feedback} onAnimationEnd={handleFeedbackEnd}>
        Save
      </button>
    </form>
  )
}
