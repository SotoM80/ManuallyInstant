// A skin: a stack of decorative layers drawn behind every page of the manual
// (see specs/skins.md and ADR 0010).
export type SkinType = 'gradient' | 'shapes' | 'pattern' | 'texture'

export type SkinParams = Record<string, number>

// One color of a skin: the id of a palette color, or null for Auto (see skinColors)
export type SkinColor = number | null

// One layer: a preset with its own values and colors. A hidden layer keeps everything.
export type SkinLayer = {
  id: number // stable while the layer exists, never reused
  preset: string // an id from SKIN_PRESETS
  params: SkinParams
  colors: [SkinColor, SkinColor] // Color A and Color B
  visible: boolean
}

// The layers in list order: the first one is drawn on top. `nextId` is the id of the next
// layer added, so a removed layer's id is never given to another one.
export type Skin = {
  layers: SkinLayer[]
  nextId: number
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
