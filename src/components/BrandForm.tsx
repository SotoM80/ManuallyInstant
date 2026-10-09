import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { AutocompleteField } from './AutocompleteField'
import { ColorPicker } from './ColorPicker'
import { DEFAULT_TITLE_STYLE, STYLE_FIELDS } from '../data/titleOptions'
import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_TYPOGRAPHY_COLOR,
  INVALID_HEX_MESSAGE,
  normalizeHex,
} from '../data/colorPalette'
import type { CoverData, ManualColors, TitleStyle } from '../types'

type StyleKey = keyof TitleStyle
type StyleValues = Record<StyleKey, string>
type ColorKey = keyof ManualColors

// Form of the Cover section: brand manual title (+ style), colors, Designed by and logo.
type BrandFormProps = {
  onSubmit?: (cover: CoverData) => void
}

const NO_STYLE_ERRORS: StyleValues = { fontFamily: '', fontStyle: '', fontSize: '' }

const DEFAULT_COLORS: ManualColors = {
  typography: DEFAULT_TYPOGRAPHY_COLOR,
  background: DEFAULT_BACKGROUND_COLOR,
}
const NO_COLOR_ERRORS: ManualColors = { typography: '', background: '' }

const COLOR_FIELDS: { key: ColorKey; label: string }[] = [
  { key: 'typography', label: 'Typography color' },
  { key: 'background', label: 'Background color' },
]

const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
const LOGO_MAX_BYTES = 5 * 1024 * 1024

function findOption(options: readonly string[], value: string) {
  const typed = value.trim().toLowerCase()
  return options.find((option) => option.toLowerCase() === typed)
}

function validateStyleValue(options: readonly string[], value: string) {
  if (value.trim() === '') return 'Required field'
  return findOption(options, value) ? '' : 'Select a valid option'
}

function validateText(value: string) {
  return value.trim() === '' ? 'Required field' : ''
}

function validateColor(value: string) {
  if (value.trim() === '') return 'Required field'
  return normalizeHex(value) ? '' : INVALID_HEX_MESSAGE
}

function validateLogo(file: File | null) {
  if (!file) return 'Required field'
  if (!LOGO_TYPES.includes(file.type)) return 'Use a PNG, JPG, SVG or WebP image'
  if (file.size > LOGO_MAX_BYTES) return 'The logo must be 5 MB or smaller'
  return ''
}

export function BrandForm({ onSubmit }: BrandFormProps) {
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [designedBy, setDesignedBy] = useState('')
  const [designedByError, setDesignedByError] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoError, setLogoError] = useState('')
  const [style, setStyle] = useState<StyleValues>(DEFAULT_TITLE_STYLE)
  const [styleErrors, setStyleErrors] = useState<StyleValues>(NO_STYLE_ERRORS)
  const [colors, setColors] = useState<ManualColors>(DEFAULT_COLORS)
  const [colorErrors, setColorErrors] = useState<ManualColors>(NO_COLOR_ERRORS)

  function updateColor(key: ColorKey, value: string, fieldError = '') {
    setColors((prev) => ({ ...prev, [key]: value }))
    setColorErrors((prev) => ({ ...prev, [key]: fieldError }))
  }

  // On blur or Enter in the HEX field: tidy a valid value ("1e88e5" → "#1E88E5"), flag the rest.
  // A blank field is only an error on submit.
  function commitColor(key: ColorKey) {
    const value = colors[key]
    if (value.trim() === '') return
    const hex = normalizeHex(value)
    updateColor(key, hex ?? value, hex ? '' : INVALID_HEX_MESSAGE)
  }

  function updateStyle(key: StyleKey, value: string, fieldError = '') {
    setStyle((prev) => ({ ...prev, [key]: value }))
    setStyleErrors((prev) => ({ ...prev, [key]: fieldError }))
  }

  // On blur or Enter: snap a case-insensitive match to the option, flag anything else.
  // A blank field is only an error on submit.
  function commitStyle(key: StyleKey, options: readonly string[]) {
    const value = style[key]
    if (value.trim() === '') return
    const match = findOption(options, value)
    updateStyle(key, match ?? value, match ? '' : 'Select a valid option')
  }

  // A wrong file is flagged as soon as it is chosen, not only on submit.
  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setLogoFile(file)
    setLogoError(file ? validateLogo(file) : '')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const titleError = validateText(title)
    const nextDesignedByError = validateText(designedBy)
    const nextLogoError = validateLogo(logoFile)

    const nextStyleErrors = { ...NO_STYLE_ERRORS }
    for (const field of STYLE_FIELDS) {
      nextStyleErrors[field.key] = validateStyleValue(field.options, style[field.key])
    }

    const nextColorErrors: ManualColors = {
      typography: validateColor(colors.typography),
      background: validateColor(colors.background),
    }

    setError(titleError)
    setDesignedByError(nextDesignedByError)
    setLogoError(nextLogoError)
    setStyleErrors(nextStyleErrors)
    setColorErrors(nextColorErrors)
    if (titleError || nextDesignedByError || nextLogoError) return
    if (Object.values(nextStyleErrors).some(Boolean) || !logoFile) return
    if (Object.values(nextColorErrors).some(Boolean)) return

    const cleanStyle = Object.fromEntries(
      STYLE_FIELDS.map((field) => [field.key, findOption(field.options, style[field.key])]),
    ) as TitleStyle
    onSubmit?.({
      title: title.trim(),
      style: cleanStyle,
      designedBy: designedBy.trim(),
      logo: { url: URL.createObjectURL(logoFile), name: logoFile.name },
      colors: {
        typography: normalizeHex(colors.typography) as string,
        background: normalizeHex(colors.background) as string,
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="brand-title">Brand manual title</label>
      <input
        id="brand-title"
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        aria-invalid={error !== ''}
        aria-describedby={error ? 'brand-title-error' : undefined}
        style={error ? { borderColor: 'red' } : undefined}
      />
      {error && (
        <p id="brand-title-error" role="alert">
          {error}
        </p>
      )}
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
        aria-invalid={designedByError !== ''}
        aria-describedby={designedByError ? 'designed-by-error' : undefined}
        style={designedByError ? { borderColor: 'red' } : undefined}
      />
      {designedByError && (
        <p id="designed-by-error" role="alert">
          {designedByError}
        </p>
      )}

      <label htmlFor="logo">Logo</label>
      <input
        id="logo"
        type="file"
        accept={LOGO_TYPES.join(',')}
        onChange={handleLogoChange}
        aria-invalid={logoError !== ''}
        aria-describedby={logoError ? 'logo-error' : undefined}
        style={logoError ? { borderColor: 'red' } : undefined}
      />
      {logoError && (
        <p id="logo-error" role="alert">
          {logoError}
        </p>
      )}

      <button type="submit">Save</button>
    </form>
  )
}
