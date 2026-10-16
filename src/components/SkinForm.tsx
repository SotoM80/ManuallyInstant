import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { SkinBackdrop } from './pages/SkinBackdrop'
import { SkinColorField } from './SkinColorField'
import { SKIN_PRESETS, SKIN_TYPES, controlMax, findPreset } from '../skins/presets'
import { SKIN_DRAWINGS } from '../skins/draw'
import { newLayerColors } from '../skins/colors'
import {
  MAX_LAYERS,
  addLayer,
  layerNames,
  moveLayer,
  removeLayer,
  setLayerColor,
  setLayerParam,
  setOnCover,
  setPageColor,
  setVisible,
} from '../skins/layers'
import { keepInPlace } from '../utils/scrollAnchor'
import { useReorderGlide } from '../utils/useReorderGlide'
import type { Skin, SkinLayer } from '../skins/types'
import type { PaletteColor } from '../types'

// Form of the Skin section: the colors of every page but the Cover, a list of layers (the first
// one is drawn on top), each one shown or hidden with a checkbox, moved with ↑ ↓ and opened like
// the colors of the Colors section, then Add layer with the gallery. Everything reaches the
// preview at once (see specs/skins.md).
type SkinFormProps = {
  skin: Skin
  onChange: (skin: Skin) => void
  palette: PaletteColor[] | null // offered as chips that copy a color
}

// Only presets with a drawing are offered, so one that is not built yet never appears
const BUILT_PRESETS = SKIN_PRESETS.filter((preset) => preset.id in SKIN_DRAWINGS)
const GALLERY = SKIN_TYPES.map((group) => ({
  ...group,
  presets: BUILT_PRESETS.filter((preset) => preset.type === group.type),
})).filter((group) => group.presets.length > 0)

const COLOR_FIELDS = [
  { index: 0, label: 'Color A' },
  { index: 1, label: 'Color B' },
] as const

const PAGE_COLOR_FIELDS = [
  { key: 'pageBackground', label: 'Page background' },
  { key: 'pageText', label: 'Page text' },
] as const

// A small page with one layer at full strength, so a preview can still be read
function previewLayer(layer: Pick<SkinLayer, 'preset' | 'params' | 'colors'>): SkinLayer {
  return { ...layer, id: 0, params: { ...layer.params, intensity: 100 }, visible: true, onCover: false }
}

export function SkinForm({ skin, onChange, palette }: SkinFormProps) {
  const [openId, setOpenId] = useState<number | null>(null) // null → every layer folded
  const [galleryOpen, setGalleryOpen] = useState(false)
  const list = useRef<HTMLOListElement>(null)
  const addButton = useRef<HTMLButtonElement>(null)
  useReorderGlide(list, skin.layers.map((layer) => layer.id).join('|'))
  const names = layerNames(skin.layers)
  const full = skin.layers.length >= MAX_LAYERS
  const startColors = newLayerColors(palette, skin) // the colors a new layer gets

  // After a move, the focus stays on the button that was pressed (or on the other arrow, when
  // the layer reached the end of the list and that button is now off)
  const moved = useRef<{ id: number; step: -1 | 1 } | null>(null)
  useEffect(() => {
    if (!moved.current || !list.current) return
    const { id, step } = moved.current
    moved.current = null
    const button = (s: number) => list.current?.querySelector<HTMLButtonElement>(`[data-move="${id}:${s}"]`)
    const pressed = button(step)
    ;(pressed && !pressed.disabled ? pressed : button(-step))?.focus()
  }, [skin.layers])

  // A new layer goes on top and opens; the open one folds
  function add(presetId: string) {
    onChange(addLayer(skin, presetId, startColors))
    setOpenId(skin.nextId)
    setGalleryOpen(false)
  }

  function move(id: number, step: -1 | 1) {
    moved.current = { id, step }
    onChange(moveLayer(skin, id, step))
  }

  function closeGallery(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape') return
    setGalleryOpen(false)
    addButton.current?.focus()
  }

  function layerBody(layer: SkinLayer, name: string) {
    const coverId = `skin-${layer.id}-cover`
    return (
      <>
        <div className="skin-check">
          <input
            id={coverId}
            type="checkbox"
            checked={layer.onCover}
            onChange={(event) => onChange(setOnCover(skin, layer.id, event.target.checked))}
          />
          <label htmlFor={coverId}>Also on the Cover</label>
        </div>

        {findPreset(layer.preset)?.controls.map((control) => {
          const id = `skin-${layer.id}-${control.key}`
          const value = layer.params[control.key] ?? control.min
          return (
            <div key={control.key} className="skin-control">
              <label htmlFor={id}>{control.label}</label>
              <input
                id={id}
                type="range"
                min={control.min}
                max={controlMax(control, layer.params)}
                step={control.step}
                value={value}
                onChange={(event) => onChange(setLayerParam(skin, layer.id, control.key, Number(event.target.value)))}
              />
              <output htmlFor={id}>
                {value}
                {control.unit}
              </output>
            </div>
          )
        })}

        {COLOR_FIELDS.map((field) => (
          <SkinColorField
            key={field.index}
            label={`${name} ${field.label}`}
            value={layer.colors[field.index]}
            onChange={(hex) => onChange(setLayerColor(skin, layer.id, field.index, hex))}
            palette={palette}
          />
        ))}
      </>
    )
  }

  return (
    <form onSubmit={(event) => event.preventDefault()} noValidate aria-label="Skin">
      {/* The colors of every page but the Cover, which keeps its own */}
      {PAGE_COLOR_FIELDS.map((field) => (
        <SkinColorField
          key={field.key}
          label={field.label}
          value={skin[field.key]}
          onChange={(hex) => onChange(setPageColor(skin, field.key, hex))}
          palette={palette}
        />
      ))}

      {skin.layers.length === 0 ? (
        <p className="logo-form-hint skin-empty">No layers yet. The inner pages show their plain Page background.</p>
      ) : (
        <ol className="skin-layers" ref={list} aria-label="Layers">
          {skin.layers.map((layer, index) => {
            const name = names.get(layer.id) ?? layer.preset
            const isOpen = openId === layer.id
            const bodyId = `skin-layer-${layer.id}-body`
            return (
              <li
                key={layer.id}
                data-key={layer.id}
                className="palette-block skin-row"
                data-open={isOpen}
                data-visible={layer.visible}
              >
                <div className="skin-row-header">
                  <input
                    type="checkbox"
                    aria-label={`Show ${name}`}
                    checked={layer.visible}
                    onChange={(event) => onChange(setVisible(skin, layer.id, event.target.checked))}
                  />
                  <button
                    type="button"
                    className="skin-row-toggle"
                    aria-expanded={isOpen}
                    aria-controls={bodyId}
                    onClick={(event) => {
                      keepInPlace(event.currentTarget) // the layer above may fold
                      setOpenId((prev) => (prev === layer.id ? null : layer.id))
                    }}
                  >
                    <span className="skin-card-preview" style={{ background: skin.pageBackground }}>
                      <SkinBackdrop layers={[previewLayer(layer)]} orientation="portrait" />
                    </span>
                    <span className="skin-row-name">{name}</span>
                    <span className="palette-block-chevron" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="skin-row-button"
                    aria-label={`Move ${name} up`}
                    data-move={`${layer.id}:-1`}
                    disabled={index === 0}
                    onClick={() => move(layer.id, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="skin-row-button"
                    aria-label={`Move ${name} down`}
                    data-move={`${layer.id}:1`}
                    disabled={index === skin.layers.length - 1}
                    onClick={() => move(layer.id, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="skin-row-button"
                    aria-label={`Remove ${name}`}
                    onClick={() => onChange(removeLayer(skin, layer.id))}
                  >
                    ✕
                  </button>
                </div>

                {/* Always in the page so it can fold and unfold; inert while folded */}
                <div id={bodyId} className="palette-block-body" inert={!isOpen}>
                  <div className="palette-block-inner">{layerBody(layer, name)}</div>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      <button
        ref={addButton}
        type="button"
        className="palette-secondary-button"
        aria-expanded={galleryOpen}
        aria-controls="skin-gallery"
        disabled={full}
        onClick={() => setGalleryOpen((open) => !open)}
      >
        + Add layer
      </button>
      {full && <p className="logo-form-hint">Up to {MAX_LAYERS} layers.</p>}

      {galleryOpen && !full && (
        <div id="skin-gallery" className="skin-gallery" role="group" aria-label="Add a layer" onKeyDown={closeGallery}>
          {GALLERY.map((group) => (
            <div key={group.type} className="skin-gallery-group">
              <p className="skin-gallery-heading">{group.label}</p>
              <div className="skin-gallery-row">
                {group.presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="skin-card"
                    aria-label={`Add ${preset.name}`}
                    onClick={() => add(preset.id)}
                  >
                    <span className="skin-card-preview" style={{ background: skin.pageBackground }}>
                      <SkinBackdrop
                        layers={[previewLayer({ preset: preset.id, params: preset.defaults, colors: startColors })]}
                        orientation="portrait"
                      />
                    </span>
                    <span className="skin-card-name">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </form>
  )
}
