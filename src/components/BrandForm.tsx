import { useMemo, useState } from 'react'
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
import type { CoverData, LogoSize, ManualColors, TitleStyle } from '../types'

type StyleKey = keyof TitleStyle
type StyleValues = Record<StyleKey, string>
type ColorKey = keyof ManualColors

// Form of the Cover section: brand manual title (+ style), colors, Designed by and logo.
// Every change reaches the preview at once; a new logo waits for its Apply (see docs/adr/0007, 0020).
type BrandFormProps = {
  onChange?: (cover: CoverData) => void
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

function validateLogo(file: File | null) {
  return validateImage(file, 'logo')
}

export function BrandForm({ onChange }: BrandFormProps) {
  const [title, setTitle] = useState('')
  const [designedBy, setDesignedBy] = useState('')
  const [logo, setLogo] = useState(NO_IMAGE)
  const [logoError, setLogoError] = useState('')
  const [logoSize, setLogoSize] = useState<LogoSize>(DEFAULT_LOGO_SIZE)
  const [style, setStyle] = useState<StyleValues>(DEFAULT_TITLE_STYLE)
  const [styleErrors, setStyleErrors] = useState<StyleValues>(NO_STYLE_ERRORS)
  // The last valid style and colors: while a field is half typed, the preview keeps these.
  const [validStyle, setValidStyle] = useState<TitleStyle>(DEFAULT_TITLE_STYLE)
  const [colors, setColors] = useState<ManualColors>(DEFAULT_COLORS)
  const [colorErrors, setColorErrors] = useState<ManualColors>(NO_COLOR_ERRORS)
  const [validColors, setValidColors] = useState<ManualColors>(DEFAULT_COLORS)

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
    setColors((prev) => ({ ...prev, [key]: value }))
    setColorErrors((prev) => ({ ...prev, [key]: fieldError }))
    const hex = normalizeHex(value)
    if (hex) setValidColors((prev) => ({ ...prev, [key]: hex }))
  }

  // On blur or Enter in the HEX field: tidy a valid value ("1e88e5" → "#1E88E5"), flag the rest.
  // A blank field is not an error: the preview keeps the last valid color.
  function commitColor(key: ColorKey) {
    const value = colors[key]
    if (value.trim() === '') return
    const hex = normalizeHex(value)
    updateColor(key, hex ?? value, hex ? '' : INVALID_HEX_MESSAGE)
  }

  function updateStyle(key: StyleKey, value: string, fieldError = '') {
    setStyle((prev) => ({ ...prev, [key]: value }))
    setStyleErrors((prev) => ({ ...prev, [key]: fieldError }))
    const field = STYLE_FIELDS.find((item) => item.key === key)
    const match = field && findOption(field.options, value)
    if (match) setValidStyle((prev) => ({ ...prev, [key]: match }))
  }

  // On blur or Enter: snap a case-insensitive match to the option, flag anything else.
  // A blank field is not an error: the preview keeps the last valid option.
  function commitStyle(key: StyleKey, options: readonly string[]) {
    const value = style[key]
    if (value.trim() === '') return
    const match = findOption(options, value)
    updateStyle(key, match ?? value, match ? '' : 'Select a valid option')
  }

  // A wrong file is flagged as soon as it is chosen. A valid one waits for its Apply.
  function handleLogoChange(file: File | null) {
    setLogo((prev) => chooseFile(prev, file))
    setLogoError(file ? validateLogo(file) : '')
  }

  return (
    <form onSubmit={(event) => event.preventDefault()} noValidate aria-label="Cover">
      <label htmlFor="brand-title">Brand manual title</label>
      <input
        id="brand-title"
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
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
        onChange={(event) => setDesignedBy(event.target.value)}
      />

      <ImageField
        id="logo"
        label="Logo"
        fileName={logo.file?.name ?? null}
        error={logoError}
        onChange={handleLogoChange}
        pending={isPending(logo, logoError)}
        onApply={() => setLogo((prev) => applyImage(prev, logoError))}
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
              onChange={() => setLogoSize(size)}
            />
            <span>{size}</span>
          </label>
        ))}
      </fieldset>
    </form>
  )
}
