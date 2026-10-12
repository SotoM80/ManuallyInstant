import { INVALID_HEX_MESSAGE, normalizeHex } from '../data/colorPalette'

// Field rules shared by the section forms (Cover, Colors). '' means valid.

export function validateText(value: string) {
  return value.trim() === '' ? 'Required field' : ''
}

export function validateColor(value: string) {
  if (value.trim() === '') return 'Required field'
  return normalizeHex(value) ? '' : INVALID_HEX_MESSAGE
}
