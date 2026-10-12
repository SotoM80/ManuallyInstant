import { useEffect, useState } from 'react'
import type { AnimationEvent, FormEvent } from 'react'
import { AutocompleteField } from './AutocompleteField'
import { BRAND_FONT_FAMILIES, DEFAULT_BRAND_FONTS, toFontFamilyCss } from '../data/fontOptions'
import { loadFontPreviews } from '../utils/googleFonts'
import { findOption, validateOption } from '../utils/validation'
import type { BrandFonts } from '../types'

// What the Save button shows after a click: a pulse with a check, or a shake.
type SaveFeedback = 'idle' | 'saved' | 'error'

type FontKey = keyof BrandFonts

// Form of the Typography section: the brand's Primary and Secondary Google Fonts.
type TypographyFormProps = {
  onSubmit?: (fonts: BrandFonts) => void
}

const FONT_FIELDS: { key: FontKey; label: string }[] = [
  { key: 'primary', label: 'Primary font' },
  { key: 'secondary', label: 'Secondary font' },
]

const NO_ERRORS: BrandFonts = { primary: '', secondary: '' }

// Each option of the list is drawn in its own font
function fontOptionStyle(family: string) {
  return { fontFamily: toFontFamilyCss(family) }
}

export function TypographyForm({ onSubmit }: TypographyFormProps) {
  const [fonts, setFonts] = useState<BrandFonts>(DEFAULT_BRAND_FONTS)
  const [errors, setErrors] = useState<BrandFonts>(NO_ERRORS)
  const [feedback, setFeedback] = useState<SaveFeedback>('idle')

  // Only the letters of the names, so the list can show every font without downloading them all
  useEffect(() => {
    loadFontPreviews(BRAND_FONT_FAMILIES)
  }, [])

  function updateFont(key: FontKey, value: string, fieldError = '') {
    setFonts((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: fieldError }))
  }

  // On blur or Enter: snap a case-insensitive match to the option, flag anything else.
  // A blank field is only an error on submit.
  function commitFont(key: FontKey) {
    const value = fonts[key]
    if (value.trim() === '') return
    const match = findOption(BRAND_FONT_FAMILIES, value)
    updateFont(key, match ?? value, match ? '' : 'Select a valid option')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: BrandFonts = {
      primary: validateOption(BRAND_FONT_FAMILIES, fonts.primary),
      secondary: validateOption(BRAND_FONT_FAMILIES, fonts.secondary),
    }
    setErrors(nextErrors)
    if (nextErrors.primary || nextErrors.secondary) {
      setFeedback('error')
      return
    }

    onSubmit?.({
      primary: findOption(BRAND_FONT_FAMILIES, fonts.primary) as string,
      secondary: findOption(BRAND_FONT_FAMILIES, fonts.secondary) as string,
    })
    setFeedback('saved')
  }

  // Back to idle when the button's own animation ends, so the next Save animates again.
  function handleFeedbackEnd(event: AnimationEvent<HTMLButtonElement>) {
    if (!event.pseudoElement) setFeedback('idle')
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Typography">
      {FONT_FIELDS.map((field) => (
        <AutocompleteField
          key={field.key}
          label={field.label}
          options={BRAND_FONT_FAMILIES}
          value={fonts[field.key]}
          error={errors[field.key]}
          onChange={(value) => updateFont(field.key, value)}
          onSelect={(option) => updateFont(field.key, option)}
          onCommit={() => commitFont(field.key)}
          optionStyle={fontOptionStyle}
        />
      ))}

      <button type="submit" data-feedback={feedback} onAnimationEnd={handleFeedbackEnd}>
        Save
      </button>
    </form>
  )
}
