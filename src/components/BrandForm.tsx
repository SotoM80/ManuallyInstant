import { useMemo, useRef, useState } from 'react'
import { AutocompleteField } from './AutocompleteField'
import { ColorPicker } from './ColorPicker'
import { ImageField } from './ImageField'
import { DEFAULT_TITLE_STYLE, STYLE_FIELDS } from '../data/titleOptions'
import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_TEXT_COLOR,
  DEFAULT_TITLE_COLOR,
  INVALID_HEX_MESSAGE,
  normalizeHex,
} from '../data/colorPalette'
import { DEFAULT_LOGO_SIZE, LOGO_SIZES } from '../data/logoOptions'
import { findOption, validateImage } from '../utils/validation'
import { NO_IMAGE, applyImage, chooseFile, isPending, shownFile, toImage, useLiveData } from '../utils/pendingImage'
import type { PendingImage } from '../utils/pendingImage'
import type { CoverData, LogoSize, ManualColors, TitleStyle } from '../types'

type StyleKey = keyof TitleStyle
type StyleValues = Record<StyleKey, string>
type ColorKey = keyof ManualColors

// Form of the Cover section: brand manual title (+ style), colors, Designed by and logo.
// Every change reaches the preview at once; a new logo waits for its Apply (see docs/adr/0007, 0020).
type BrandFormProps = {
  onChange?: (cover: CoverData) => void
  // Optional owner of the form's fields (App keeps them so they survive moving between pages,
  // specs/navmenu.md Scenario 4). Without it, the form keeps its own fields.
  draft?: CoverDraft
  onDraftChange?: (draft: CoverDraft) => void
}

// Everything the form shows, half-typed values and errors included.
export type CoverDraft = {
  title: string
  designedBy: string
  logo: PendingImage
  logoError: string
  logoSize: LogoSize
  style: StyleValues
  styleErrors: StyleValues
  // The last valid style and colors: while a field is half typed, the preview keeps these.
  validStyle: TitleStyle
  colors: ManualColors
  colorErrors: ManualColors
  validColors: ManualColors
}

const NO_STYLE_ERRORS: StyleValues = { fontFamily: '', fontStyle: '', fontSize: '' }

const DEFAULT_COLORS: ManualColors = {
  title: DEFAULT_TITLE_COLOR,
  text: DEFAULT_TEXT_COLOR,
  background: DEFAULT_BACKGROUND_COLOR,
}
const NO_COLOR_ERRORS: ManualColors = { title: '', text: '', background: '' }

const COLOR_FIELDS: { key: ColorKey; label: string }[] = [
  { key: 'title', label: 'Title color' },
  { key: 'text', label: 'Text color' },
  { key: 'background', label: 'Background color' },
]

const NO_COVER_DRAFT: CoverDraft = {
  title: '',
  designedBy: '',
  logo: NO_IMAGE,
  logoError: '',
  logoSize: DEFAULT_LOGO_SIZE,
  style: DEFAULT_TITLE_STYLE,
  styleErrors: NO_STYLE_ERRORS,
  validStyle: DEFAULT_TITLE_STYLE,
  colors: DEFAULT_COLORS,
  colorErrors: NO_COLOR_ERRORS,
  validColors: DEFAULT_COLORS,
}

function validateLogo(file: File | null) {
  return validateImage(file, 'logo')
}

export function BrandForm({ onChange, draft: ownerDraft, onDraftChange }: BrandFormProps) {
  const [ownDraft, setOwnDraft] = useState(ownerDraft ?? NO_COVER_DRAFT)
  const draft = ownerDraft ?? ownDraft
  const { title, designedBy, logo, logoError, logoSize } = draft
  const { style, styleErrors, validStyle, colors, colorErrors, validColors } = draft
  // The newest fields, so two changes in one event (select, then commit) build on each other.
  const latest = useRef(draft)

  function update(change: (prev: CoverDraft) => Partial<CoverDraft>) {
    const next = { ...latest.current, ...change(latest.current) }
    latest.current = next
    setOwnDraft(next)
    onDraftChange?.(next)
  }

  const shownLogo = shownFile(logo)
  const cover = useMemo<CoverData>(
    () => ({
      title: title.trim(),
      style: validStyle,
      designedBy: designedBy.trim(),
      logo: shownLogo ? { ...toImage(shownLogo), size: logoSize } : null,
      colors: validColors,
    }),
    [title, validStyle, designedBy, shownLogo, logoSize, validColors],
  )
  useLiveData(cover, onChange)

  function updateColor(key: ColorKey, value: string, fieldError = '') {
    const hex = normalizeHex(value)
    update((prev) => ({
      colors: { ...prev.colors, [key]: value },
      colorErrors: { ...prev.colorErrors, [key]: fieldError },
      validColors: hex ? { ...prev.validColors, [key]: hex } : prev.validColors,
    }))
  }

  // On blur or Enter in the HEX field: tidy a valid value ("1e88e5" → "#1E88E5"), flag the rest.
  // A blank field is not an error: the preview keeps the last valid color.
  function commitColor(key: ColorKey) {
    const value = latest.current.colors[key]
    if (value.trim() === '') return
    const hex = normalizeHex(value)
    updateColor(key, hex ?? value, hex ? '' : INVALID_HEX_MESSAGE)
  }

  function updateStyle(key: StyleKey, value: string, fieldError = '') {
    const field = STYLE_FIELDS.find((item) => item.key === key)
    const match = field && findOption(field.options, value)
    update((prev) => ({
      style: { ...prev.style, [key]: value },
      styleErrors: { ...prev.styleErrors, [key]: fieldError },
      validStyle: match ? { ...prev.validStyle, [key]: match } : prev.validStyle,
    }))
  }

  // On blur or Enter: snap a case-insensitive match to the option, flag anything else.
  // A blank field is not an error: the preview keeps the last valid option.
  function commitStyle(key: StyleKey, options: readonly string[]) {
    const value = latest.current.style[key]
    if (value.trim() === '') return
    const match = findOption(options, value)
    updateStyle(key, match ?? value, match ? '' : 'Select a valid option')
  }

  // A wrong file is flagged as soon as it is chosen. A valid one waits for its Apply.
  function handleLogoChange(file: File | null) {
    update((prev) => ({ logo: chooseFile(prev.logo, file), logoError: file ? validateLogo(file) : '' }))
  }

  return (
    <form onSubmit={(event) => event.preventDefault()} noValidate aria-label="Cover">
      <label htmlFor="brand-title">Brand manual title</label>
      <input
        id="brand-title"
        type="text"
        value={title}
        onChange={(event) => update(() => ({ title: event.target.value }))}
      />
      {STYLE_FIELDS.map((field) => (
        <AutocompleteField
          key={field.key}
          label={field.label}
          options={field.options}
          value={style[field.key]}
          error={styleErrors[field.key]}
          onChange={(value) => updateStyle(field.key, value)}
          onSelect={(option) => updateStyle(field.key, option)}
          onCommit={() => commitStyle(field.key, field.options)}
        />
      ))}

      {COLOR_FIELDS.map((field) => (
        <ColorPicker
          key={field.key}
          label={field.label}
          value={colors[field.key]}
          error={colorErrors[field.key]}
          onChange={(value) => updateColor(field.key, value)}
          onSelect={(hex) => updateColor(field.key, hex)}
          onCommit={() => commitColor(field.key)}
        />
      ))}

      <label htmlFor="designed-by">Designed by</label>
      <input
        id="designed-by"
        type="text"
        value={designedBy}
        onChange={(event) => update(() => ({ designedBy: event.target.value }))}
      />

      <ImageField
        id="logo"
        label="Logo"
        fileName={logo.file?.name ?? null}
        error={logoError}
        onChange={handleLogoChange}
        pending={isPending(logo, logoError)}
        onApply={() => update((prev) => ({ logo: applyImage(prev.logo, prev.logoError) }))}
      />

      {/* Always one option chosen, so it never shows an error */}
      <fieldset className="segmented-control logo-size-control">
        <legend>Logo size</legend>
        {LOGO_SIZES.map((size) => (
          <label key={size}>
            <input
              type="radio"
              name="logo-size"
              value={size}
              checked={logoSize === size}
              onChange={() => update(() => ({ logoSize: size }))}
            />
            <span>{size}</span>
          </label>
        ))}
      </fieldset>
    </form>
  )
}
