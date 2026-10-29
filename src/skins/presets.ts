import { DEFAULT_BACKGROUND_COLOR, DEFAULT_TEXT_COLOR } from '../data/colorPalette'
import { DEFAULT_BOXES } from './boxes'
import type { Skin, SkinControl, SkinParams, SkinPreset, SkinType } from './types'

// Every preset also has Intensity: how strong the layer is over the page (its opacity).
// It starts low so the text of the manual stays easy to read.
const INTENSITY: SkinControl = { key: 'intensity', label: 'Intensity', min: 5, max: 100, step: 5, unit: '%' }
const DEFAULT_INTENSITY = 30

const angle = (label = 'Angle'): SkinControl => ({ key: 'angle', label, min: 0, max: 360, step: 5, unit: '°' })

// The presets, grouped by type in the gallery (see specs/skins.md).
// The form is built from their controls, so a new preset only needs an entry here and a way
// to draw it (draw/).
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
    id: 'circles',
    name: 'Circles',
    type: 'shapes',
    defaults: { count: 3, size: 45, angle: 45 },
    controls: [
      { key: 'count', label: 'Count', min: 1, max: 8, step: 1, unit: '' },
      { key: 'size', label: 'Size', min: 10, max: 90, step: 5, unit: '%' },
      angle('Direction'),
    ],
  },
  {
    id: 'diagonal',
    name: 'Diagonal block',
    type: 'shapes',
    defaults: { angle: 20, coverage: 35 },
    controls: [
      { key: 'angle', label: 'Angle', min: -60, max: 60, step: 5, unit: '°' },
      { key: 'coverage', label: 'Coverage', min: 10, max: 90, step: 5, unit: '%' },
    ],
  },
  {
    id: 'waves',
    name: 'Waves',
    type: 'shapes',
    defaults: { amplitude: 12, frequency: 2, angle: 0 },
    controls: [
      { key: 'amplitude', label: 'Amplitude', min: 2, max: 40, step: 1, unit: 'mm' },
      { key: 'frequency', label: 'Frequency', min: 1, max: 8, step: 1, unit: '' },
      angle(),
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
  {
    id: 'grain',
    name: 'Grain',
    type: 'texture',
    defaults: { size: 1 },
    controls: [{ key: 'size', label: 'Grain size', min: 0.5, max: 4, step: 0.5, unit: '' }],
  },
  {
    id: 'paper',
    name: 'Paper',
    type: 'texture',
    defaults: { size: 2 },
    controls: [{ key: 'size', label: 'Fiber size', min: 1, max: 6, step: 0.5, unit: '' }],
  },
  // A picture of the user's (ADR 0023): no values of its own but Intensity, and no colors
  { id: 'image', name: 'Image', type: 'image', defaults: {}, controls: [] },
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
  { type: 'image', label: 'Images' },
]

// White pages with black text and no layers
export const NO_SKIN: Skin = {
  pageBackground: DEFAULT_BACKGROUND_COLOR,
  pageText: DEFAULT_TEXT_COLOR,
  boxes: DEFAULT_BOXES,
  layers: [],
  nextId: 1,
}

export function findPreset(id: string) {
  return SKIN_PRESETS.find((preset) => preset.id === id)
}

// The highest value a slider can take now: Thickness never passes Spacing (Stripes)
export function controlMax(control: SkinControl, params: SkinParams) {
  return control.key === 'thickness' && params.scale !== undefined
    ? Math.min(control.max, params.scale)
    : control.max
}

// New values for a skin, kept within each other: lowering Spacing below Thickness lowers it too
export function withParam(params: SkinParams, key: string, value: number): SkinParams {
  const next = { ...params, [key]: value }
  if (next.thickness !== undefined && next.scale !== undefined && next.thickness > next.scale) {
    next.thickness = next.scale
  }
  return next
}
