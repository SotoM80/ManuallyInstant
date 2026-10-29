import type { CSSProperties } from 'react'
import type { ImageBoxes, Skin, SkinControl } from './types'

// The look of every image box of the inner pages (specs/imageboxes.md, ADR 0022). The defaults
// are the look the boxes had before, so an untouched skin changes nothing.
export const DEFAULT_BOXES: ImageBoxes = { radius: 4, margin: 8, outline: true, outlineWidth: 1 }

type BoxNumber = 'radius' | 'margin' | 'outlineWidth'

// The sliders of the Image boxes group, like a layer's (Thickness only matters with an outline)
export const BOX_CONTROLS: (SkinControl & { key: BoxNumber })[] = [
  { key: 'radius', label: 'Corner radius', min: 0, max: 24, step: 1, unit: ' px' },
  { key: 'margin', label: 'Inner margin', min: 0, max: 20, step: 1, unit: '%' },
  { key: 'outlineWidth', label: 'Thickness', min: 1, max: 4, step: 1, unit: ' px' },
]

export function setBoxes(skin: Skin, changes: Partial<ImageBoxes>): Skin {
  return { ...skin, boxes: { ...skin.boxes, ...changes } }
}

// The CSS variables an inner page sets for its boxes; shared.css reads them in .logo-figure.
// The outline stays inside the box (an inset shadow), so a thicker one never makes it grow.
export function boxVariables({ radius, margin, outline, outlineWidth }: ImageBoxes): CSSProperties {
  return {
    '--box-radius': `${radius}px`,
    '--box-margin': `${margin}%`,
    '--box-outline': outline
      ? `inset 0 0 0 ${outlineWidth}px color-mix(in srgb, currentColor 15%, transparent)`
      : 'none',
  } as CSSProperties
}
