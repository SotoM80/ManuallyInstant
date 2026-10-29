import type { SkinLayer } from '../types'
import type { SkinShape } from './types'

// The Image layer (ADR 0023): a picture of the user's, not drawn from values and colors
export const IMAGE_PRESET = 'image'

export function isImageLayer(layer: Pick<SkinLayer, 'preset'>) {
  return layer.preset === IMAGE_PRESET
}

// Its picture over the whole page, or nothing until one is applied
export function drawImage(layer: Pick<SkinLayer, 'image' | 'fit'>): SkinShape | null {
  return layer.image ? { kind: 'image', url: layer.image.url, fit: layer.fit ?? 'cover' } : null
}
