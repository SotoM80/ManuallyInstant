import { useEffect } from 'react'
import { AutocompleteField } from './AutocompleteField'
import { BRAND_FONT_FAMILIES, DEFAULT_BRAND_FONTS, toFontFamilyCss } from '../data/fontOptions'
import { loadFontPreviews } from '../utils/googleFonts'
import { findOption } from '../utils/validation'
import { useLiveData } from '../utils/pendingImage'
import { useDraft } from '../utils/useDraft'
import type { BrandFonts } from '../types'

type FontKey = keyof BrandFonts

// Form of the Typography section: the brand's Primary and Secondary Google Fonts.
// A valid font reaches the preview at once.
type TypographyFormProps = {
  onChange?: (fonts: BrandFonts) => void
  // Optional owner of the form's fields (see useDraft)
  draft?: TypographyDraft
  onDraftChange?: (draft: TypographyDraft) => void
}

// Everything the form shows, half-typed names and errors included.
export type TypographyDraft = {
  fonts: BrandFonts
  errors: BrandFonts
  // The last valid fonts: while a name is half typed, the preview keeps these.
  validFonts: BrandFonts
}

const FONT_FIELDS: { key: FontKey; label: string }[] = [
  { key: 'primary', label: 'Primary font' },
  { key: 'secondary', label: 'Secondary font' },
]

const NO_ERRORS: BrandFonts = { primary: '', secondary: '' }

const NO_TYPOGRAPHY_DRAFT: TypographyDraft = {
  fonts: DEFAULT_BRAND_FONTS,
  errors: NO_ERRORS,
  validFonts: DEFAULT_BRAND_FONTS,
}

// Each option of the list is drawn in its own font
function fontOptionStyle(family: string) {
  return { fontFamily: toFontFamilyCss(family) }
}

export function TypographyForm({ onChange, draft: ownerDraft, onDraftChange }: TypographyFormProps) {
  const [draft, update, current] = useDraft(NO_TYPOGRAPHY_DRAFT, ownerDraft, onDraftChange)
  const { fonts, errors, validFonts } = draft
  useLiveData(validFonts, onChange)

  // Only the letters of the names, so the list can show every font without downloading them all
  useEffect(() => {
    loadFontPreviews(BRAND_FONT_FAMILIES)
  }, [])

  function updateFont(key: FontKey, value: string, fieldError = '') {
    const match = findOption(BRAND_FONT_FAMILIES, value)
    update((prev) => ({
      fonts: { ...prev.fonts, [key]: value },
      errors: { ...prev.errors, [key]: fieldError },
      // Same object while the font stays the same, so the preview is not sent it again
      validFonts:
        match && prev.validFonts[key] !== match ? { ...prev.validFonts, [key]: match } : prev.validFonts,
    }))
  }

  // On blur or Enter: snap a case-insensitive match to the option, flag anything else.
  // A blank field is not an error: the preview keeps the last valid font.
  function commitFont(key: FontKey) {
    const value = current().fonts[key]
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
