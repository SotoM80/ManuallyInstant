// A skin: the decorative layer drawn behind every page of the manual (see specs/skins.md).
// `colors` are indices into the brand palette (Colors section); the skin uses them in order.
export type SkinType = 'gradient' | 'shapes' | 'pattern' | 'texture'

export type SkinParams = Record<string, number>

export type Skin = {
  preset: string // an id from SKIN_PRESETS, or 'none' (the plain background)
  params: SkinParams
  colors: number[]
}

// One slider of a preset, e.g. Angle 0–360°
export type SkinControl = {
  key: string
  label: string
  min: number
  max: number
  step: number
  unit: string
}

export type SkinPreset = {
  id: string
  name: string
  type: SkinType
  defaults: SkinParams
  controls: SkinControl[]
}
