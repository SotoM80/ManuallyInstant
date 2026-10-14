import { useEffect, useState } from 'react'
import { AutocompleteField } from './AutocompleteField'
import { BRAND_FONT_FAMILIES, DEFAULT_BRAND_FONTS, toFontFamilyCss } from '../data/fontOptions'
import { loadFontPreviews } from '../utils/googleFonts'
import { findOption } from '../utils/validation'
import { useLiveData } from '../utils/pendingImage'
import type { BrandFonts } from '../types'

type FontKey = keyof BrandFonts

// Form of the Typography section: the brand's Primary and Secondary Google Fonts.
// A valid font reaches the preview at once.
type TypographyFormProps = {
  onChange?: (fonts: BrandFonts) => void
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

export function TypographyForm({ onChange }: TypographyFormProps) {
  const [fonts, setFonts] = useState<BrandFonts>(DEFAULT_BRAND_FONTS)
  const [errors, setErrors] = useState<BrandFonts>(NO_ERRORS)
  // The last valid fonts: while a name is half typed, the preview keeps these.
  const [validFonts, setValidFonts] = useState<BrandFonts>(DEFAULT_BRAND_FONTS)
  useLiveData(validFonts, onChange)

  // Only the letters of the names, so the list can show every font without downloading them all
  useEffect(() => {
    loadFontPreviews(BRAND_FONT_FAMILIES)
  }, [])

  function updateFont(key: FontKey, value: string, fieldError = '') {
    setFonts((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: fieldError }))
    const match = findOption(BRAND_FONT_FAMILIES, value)
    if (match) setValidFonts((prev) => (prev[key] === match ? prev : { ...prev, [key]: match }))
  }

  // On blur or Enter: snap a case-insensitive match to the option, flag anything else.
  // A blank field is not an error: the preview keeps the last valid font.
  function commitFont(key: FontKey) {
    const value = fonts[key]
    if (value.trim() === '') return
    const match = findOption(BRAND_FONT_FAMILIES, value)
    updateFont(key, match ?? value, match ? '' : 'Select a valid option')
  }

  return (
    <form onSubmit={(event) => event.preventDefault()} noValidate aria-label="Typography">
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
    </form>
  )
}
