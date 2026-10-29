// A skin: a stack of decorative layers drawn behind every page of the manual
// (see specs/skins.md and ADR 0010).
export type SkinType = 'gradient' | 'shapes' | 'pattern' | 'texture'

export type SkinParams = Record<string, number>

// One layer: a preset with its own values and colors. A hidden layer keeps everything.
export type SkinLayer = {
  id: number // stable while the layer exists, never reused
  preset: string // an id from SKIN_PRESETS
  params: SkinParams
  colors: [string, string] // Color A and Color B, as "#RRGGBB" (a palette color is copied, ADR 0011)
  visible: boolean
  onCover: boolean // also drawn on the Cover (the inner pages always draw it)
}

// How every page but the Cover looks: its background, its text and the layers in list order
// (the first one is drawn on top). `nextId` is the id of the next layer added, so a removed
// layer's id is never given to another one.
export type Skin = {
  pageBackground: string
  pageText: string
  boxes: ImageBoxes
  layers: SkinLayer[]
  nextId: number
}

// The look of every image box of the inner pages, in px and % (specs/imageboxes.md, ADR 0022)
export type ImageBoxes = {
  radius: number // corner radius, 0–24 px
  margin: number // room between the image and the edge, 0–20 % of the box
  outline: boolean
  outlineWidth: number // 1–4 px, kept while the outline is off
}

export type PageColorKey = 'pageBackground' | 'pageText'

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
