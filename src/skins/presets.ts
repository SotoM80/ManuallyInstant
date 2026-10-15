import type { Skin, SkinControl, SkinPreset, SkinType } from './types'

// Every preset also has Intensity: how strong the layer is over the page (its opacity).
// It starts low so the text of the manual stays easy to read.
const INTENSITY: SkinControl = { key: 'intensity', label: 'Intensity', min: 5, max: 100, step: 5, unit: '%' }
const DEFAULT_INTENSITY = 30

const angle = (label = 'Angle'): SkinControl => ({ key: 'angle', label, min: 0, max: 360, step: 5, unit: '°' })

// The presets of the first version (the MVP of specs/skins.md), grouped by type in the gallery.
// Shapes and Textures come back with their drawings. The form is built from
// their controls, so a new preset only needs an entry here and a way to draw it (draw/).
const PRESETS: SkinPreset[] = [
  {
    id: 'linear',
    name: 'Linear',
    type: 'gradient',
    defaults: { angle: 135 },
    controls: [angle()],
  },
  {
    id: 'radial',
    name: 'Radial',
    type: 'gradient',
    defaults: { cx: 30, cy: 25, radius: 80 },
    controls: [
      { key: 'cx', label: 'Center X', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'cy', label: 'Center Y', min: 0, max: 100, step: 5, unit: '%' },
      { key: 'radius', label: 'Radius', min: 20, max: 150, step: 5, unit: '%' },
    ],
  },
  {
    id: 'dots',
    name: 'Dots',
    type: 'pattern',
    defaults: { scale: 10, angle: 0 },
    controls: [{ key: 'scale', label: 'Scale', min: 3, max: 30, step: 1, unit: 'mm' }, angle()],
  },
  {
    id: 'stripes',
    name: 'Stripes',
    type: 'pattern',
    defaults: { scale: 12, thickness: 4, angle: 45 },
    controls: [
      { key: 'scale', label: 'Spacing', min: 4, max: 40, step: 1, unit: 'mm' },
      { key: 'thickness', label: 'Thickness', min: 1, max: 20, step: 1, unit: 'mm' },
      angle(),
    ],
  },
]

export const SKIN_PRESETS: SkinPreset[] = PRESETS.map((preset) => ({
  ...preset,
  defaults: { ...preset.defaults, intensity: DEFAULT_INTENSITY },
  controls: [...preset.controls, INTENSITY],
}))

export const SKIN_TYPES: { type: SkinType; label: string }[] = [
  { type: 'gradient', label: 'Gradients' },
  { type: 'shapes', label: 'Shapes' },
  { type: 'pattern', label: 'Patterns' },
  { type: 'texture', label: 'Textures' },
]

// The plain background of today: no layer at all
export const NO_SKIN: Skin = { preset: 'none', params: {}, colors: [null, null] }

export function findPreset(id: string) {
  return SKIN_PRESETS.find((preset) => preset.id === id)
}

// A preset with its default values and the colors already chosen
export function skinFor(id: string, colors: Skin['colors'] = [null, null]): Skin {
  const preset = findPreset(id)
  return preset ? { preset: id, params: { ...preset.defaults }, colors } : { ...NO_SKIN, colors }
}
