import { INVALID_HEX_MESSAGE, normalizeHex } from '../data/colorPalette'

// Field rules shared by the section forms (Cover, Colors, Typography). '' means valid.

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
