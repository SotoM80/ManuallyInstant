import { findPreset, withParam } from './presets'
import type { PageColorKey, Skin, SkinLayer } from './types'

// The list of layers of a skin (see specs/skins.md). The first layer is drawn on top.
// Every function returns a new skin, so the form only calls them and passes the result on.
export const MAX_LAYERS = 4

function update(skin: Skin, id: number, change: (layer: SkinLayer) => SkinLayer): Skin {
  return { ...skin, layers: skin.layers.map((layer) => (layer.id === id ? change(layer) : layer)) }
}

export function setPageColor(skin: Skin, key: PageColorKey, hex: string): Skin {
  return { ...skin, [key]: hex }
}

// A new layer goes on top, with the preset's default values and the given colors, on, and
// only on the inner pages
export function addLayer(skin: Skin, presetId: string, colors: SkinLayer['colors']): Skin {
  const preset = findPreset(presetId)
  if (!preset || skin.layers.length >= MAX_LAYERS) return skin
  const layer: SkinLayer = {
    id: skin.nextId,
    preset: presetId,
    params: { ...preset.defaults },
    colors,
    visible: true,
    onCover: false,
  }
  return { ...skin, layers: [layer, ...skin.layers], nextId: skin.nextId + 1 }
}

export function removeLayer(skin: Skin, id: number): Skin {
  return { ...skin, layers: skin.layers.filter((layer) => layer.id !== id) }
}

// Swaps a layer with the one above it (-1) or below it (1); at the ends of the list, nothing moves
export function moveLayer(skin: Skin, id: number, step: -1 | 1): Skin {
  const from = skin.layers.findIndex((layer) => layer.id === id)
  const to = from + step
  if (from < 0 || to < 0 || to >= skin.layers.length) return skin
  const layers = [...skin.layers]
  ;[layers[from], layers[to]] = [layers[to], layers[from]]
  return { ...skin, layers }
}

export function setVisible(skin: Skin, id: number, visible: boolean): Skin {
  return update(skin, id, (layer) => ({ ...layer, visible }))
}

export function setOnCover(skin: Skin, id: number, onCover: boolean): Skin {
  return update(skin, id, (layer) => ({ ...layer, onCover }))
}

// A slider of a layer, kept within the others (Thickness never passes Spacing)
export function setLayerParam(skin: Skin, id: number, key: string, value: number): Skin {
  return update(skin, id, (layer) => ({ ...layer, params: withParam(layer.params, key, value) }))
}

export function setLayerColor(skin: Skin, id: number, index: 0 | 1, color: string): Skin {
  return update(skin, id, (layer) => {
    const colors: SkinLayer['colors'] = [...layer.colors]
    colors[index] = color
    return { ...layer, colors }
  })
}

// The name of each layer: its preset's, numbered by when it was added when a preset is used
// more than once (Dots, Dots 2). Moving a layer never changes its name.
export function layerNames(layers: SkinLayer[]) {
  const names = new Map<number, string>()
  const used = new Map<string, number>()
  for (const layer of [...layers].sort((a, b) => a.id - b.id)) {
    const count = (used.get(layer.preset) ?? 0) + 1
    used.set(layer.preset, count)
    const name = findPreset(layer.preset)?.name ?? layer.preset
    names.set(layer.id, count === 1 ? name : `${name} ${count}`)
  }
  return names
}
