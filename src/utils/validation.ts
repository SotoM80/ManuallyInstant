import { INVALID_HEX_MESSAGE, normalizeHex } from '../data/colorPalette'

// Field rules shared by the section forms (Cover, Logo, Colors, Typography). '' means valid.

export function validateText(value: string) {
  return value.trim() === '' ? 'Required field' : ''
}

export function validateColor(value: string) {
  if (value.trim() === '') return 'Required field'
  return normalizeHex(value) ? '' : INVALID_HEX_MESSAGE
}

// Case-insensitive match of what was typed against the options ("inter" → "Inter").
export function findOption(options: readonly string[], value: string) {
  const typed = value.trim().toLowerCase()
  return options.find((option) => option.toLowerCase() === typed)
}

// For autocomplete fields: the value must be one of the options.
export function validateOption(options: readonly string[], value: string) {
  if (value.trim() === '') return 'Required field'
  return findOption(options, value) ? '' : 'Select a valid option'
}

// For sizes typed as text (px, mm): a number greater than 0.
export function validatePositiveNumber(value: string) {
  if (value.trim() === '') return 'Required field'
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? '' : 'Enter a number greater than 0'
}

export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
const IMAGE_MAX_BYTES = 5 * 1024 * 1024

// Uploaded images (Cover logo, Logo versions, construction grid).
// `subject` names the file in the size message: "The logo must be 5 MB or smaller".
export function validateImage(file: File | null, subject = 'image') {
  if (!file) return 'Required field'
  if (!IMAGE_TYPES.includes(file.type)) return 'Use a PNG, JPG, SVG or WebP image'
  if (file.size > IMAGE_MAX_BYTES) return `The ${subject} must be 5 MB or smaller`
  return ''
}
