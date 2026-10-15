import { SkinLayer } from './pages/SkinLayer'
import { NO_SKIN, SKIN_PRESETS, SKIN_TYPES, skinFor } from '../skins/presets'
import { SKIN_DRAWINGS } from '../skins/draw'
import { autoColorName, skinColors } from '../skins/colors'
import type { Skin, SkinColor } from '../skins/types'
import type { PaletteColor } from '../types'

// Form of the Skin section: a gallery of presets, the sliders of the chosen one and its two
// colors. Everything reaches the preview at once: there are no images here (see specs/skins.md).
type SkinFormProps = {
  skin: Skin
  onChange: (skin: Skin) => void
  palette: PaletteColor[] | null
  pageColors: { background: string; ink: string } // the Cover's colors, which fill in for missing ones
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

export function SkinForm({ skin, onChange, palette, pageColors }: SkinFormProps) {
  const colors = skinColors(palette, skin.colors, pageColors)
  const preset = SKIN_PRESETS.find((option) => option.id === skin.preset)

  function choosePreset(id: string) {
    onChange(id === NO_SKIN.preset ? { ...NO_SKIN, colors: skin.colors } : skinFor(id, skin.colors))
  }

  function setParam(key: string, value: number) {
    onChange({ ...skin, params: { ...skin.params, [key]: value } })
  }

  function setColor(index: 0 | 1, value: string) {
    const next: Skin['colors'] = [...skin.colors]
    next[index] = value === 'auto' ? null : Number(value)
    onChange({ ...skin, colors: next })
  }

  // A color that was removed from the palette counts as Auto, so the select shows Auto too
  function selectValue(color: SkinColor) {
    return palette?.some((entry) => entry.id === color) ? String(color) : 'auto'
  }

  function card(id: string, name: string, preview: Skin) {
    return (
      <label key={id} className="skin-card">
        <input
          type="radio"
          name="skin-preset"
          value={id}
          checked={skin.preset === id}
          onChange={() => choosePreset(id)}
        />
        <span className="skin-card-preview" style={{ background: pageColors.background }}>
          <SkinLayer skin={preview} colors={colors} orientation="portrait" />
        </span>
        <span className="skin-card-name">{name}</span>
      </label>
    )
  }

  return (
    <form onSubmit={(event) => event.preventDefault()} noValidate aria-label="Skin">
      <fieldset className="skin-gallery">
        <legend>Skin</legend>
        <div className="skin-gallery-row">{card(NO_SKIN.preset, 'None', NO_SKIN)}</div>
        {GALLERY.map((group) => (
          <div key={group.type} className="skin-gallery-group">
            <p className="skin-gallery-heading">{group.label}</p>
            <div className="skin-gallery-row">
              {/* Cards are drawn at full strength, so a small preview can still be read */}
              {group.presets.map((option) =>
                card(option.id, option.name, {
                  ...skinFor(option.id, skin.colors),
                  params: { ...option.defaults, intensity: 100 },
                }),
              )}
            </div>
          </div>
        ))}
      </fieldset>

      {preset?.controls.map((control) => {
        const id = `skin-${control.key}`
        const value = skin.params[control.key] ?? control.min
        return (
          <div key={control.key} className="skin-control">
            <label htmlFor={id}>{control.label}</label>
            <input
              id={id}
              type="range"
              min={control.min}
              max={control.max}
              step={control.step}
              value={value}
              onChange={(event) => setParam(control.key, Number(event.target.value))}
            />
            <output htmlFor={id}>
              {value}
              {control.unit}
            </output>
          </div>
        )
      })}

      {COLOR_FIELDS.map((field) => {
        const id = `skin-color-${field.index}`
        return (
          <div key={field.index} className="skin-color">
            <label htmlFor={id}>{field.label}</label>
            <span className="palette-block-chip" style={{ background: colors[field.index] }} aria-hidden="true" />
            <select
              id={id}
              value={selectValue(skin.colors[field.index])}
              onChange={(event) => setColor(field.index, event.target.value)}
            >
              {/* Auto says which color it is using right now, e.g. "Auto · Red" */}
              <option value="auto">Auto · {autoColorName(palette, field.index)}</option>
              {palette?.map((entry, i) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name || `Color ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        )
      })}
      <p className="logo-form-hint">
        Auto uses your first two palette colors. Without them, the Typography and Background colors fill in.
      </p>
    </form>
  )
}
