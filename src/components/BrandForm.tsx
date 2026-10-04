import { useState } from 'react'
import type { FormEvent } from 'react'
import { AutocompleteField } from './AutocompleteField'
import { DEFAULT_TITLE_STYLE, STYLE_FIELDS } from '../data/titleOptions'
import type { TitleStyle } from '../types'

type StyleKey = keyof TitleStyle
type StyleValues = Record<StyleKey, string>

type BrandFormProps = {
  onSubmit?: (title: string, style: TitleStyle) => void
}

const NO_STYLE_ERRORS: StyleValues = { fontFamily: '', color: '', fontStyle: '', fontSize: '' }

function findOption(options: readonly string[], value: string) {
  const typed = value.trim().toLowerCase()
  return options.find((option) => option.toLowerCase() === typed)
}

function validateStyleValue(options: readonly string[], value: string) {
  if (value.trim() === '') return 'Required field'
  return findOption(options, value) ? '' : 'Select a valid option'
}

export function BrandForm({ onSubmit }: BrandFormProps) {
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [style, setStyle] = useState<StyleValues>(DEFAULT_TITLE_STYLE)
  const [styleErrors, setStyleErrors] = useState<StyleValues>(NO_STYLE_ERRORS)

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanTitle = title.trim()
    const titleError = cleanTitle === '' ? 'Required field' : ''

    const nextStyleErrors = { ...NO_STYLE_ERRORS }
    for (const field of STYLE_FIELDS) {
      nextStyleErrors[field.key] = validateStyleValue(field.options, style[field.key])
    }

    setError(titleError)
    setStyleErrors(nextStyleErrors)
    if (titleError || Object.values(nextStyleErrors).some(Boolean)) return

    const cleanStyle = Object.fromEntries(
      STYLE_FIELDS.map((field) => [field.key, findOption(field.options, style[field.key])]),
    ) as TitleStyle
    onSubmit?.(cleanTitle, cleanStyle)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="brand-title">Brand title</label>
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
      <button type="submit">Save</button>
    </form>
  )
}
