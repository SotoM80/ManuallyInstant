import { useId, useState } from 'react'
import { SPACING_CONTROLS } from '../skins/spacing'
import type { SectionId, SectionSpacing } from '../skins/types'

type LineSpacingFieldProps = {
  section: SectionId
  label: string // the section's name, e.g. "Logo" → "Logo title line spacing"
  value: SectionSpacing
  onChange: (change: Partial<SectionSpacing>) => void // only the value that changes
  sectionOpen: boolean // the group folds again whenever its section is closed
}

// The folded "Line spacing" group at the end of a section's form: its titles and its text, as a
// share of today's line heights (specs/linespacing.md, ADR 0026). Live, like the Skin's sliders.
// It folds like the Section background group next to it, and shares its look.
export function LineSpacingField({ section, label, value, onChange, sectionOpen }: LineSpacingFieldProps) {
  const [open, setOpen] = useState(false)
  // Folds when the section closes, so it is folded every time the section is opened again
  const [wasSectionOpen, setWasSectionOpen] = useState(sectionOpen)
  if (wasSectionOpen !== sectionOpen) {
    setWasSectionOpen(sectionOpen)
    if (!sectionOpen) setOpen(false)
  }
  const bodyId = useId()

  return (
    <div className="section-background line-spacing" data-open={open}>
      <button
        type="button"
        className="section-background-toggle"
        aria-expanded={open}
        aria-controls={bodyId}
        aria-label={`${label} line spacing`}
        onClick={() => setOpen((prev) => !prev)}
      >
        Line spacing
        <span className="more-area-chevron" aria-hidden="true" />
      </button>
      <div id={bodyId} className="section-background-body" hidden={!open} inert={!open}>
        {open &&
          SPACING_CONTROLS.map((control) => {
            const id = `section-${section}-${control.key}-spacing`
            return (
              <div key={control.key} className="skin-control">
                <label htmlFor={id}>{control.label}</label>
                <input
                  id={id}
                  type="range"
                  aria-label={`${label} ${control.key} line spacing`}
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={value[control.key]}
                  onChange={(event) => onChange({ [control.key]: Number(event.target.value) })}
                />
                <output htmlFor={id}>
                  {value[control.key]}
                  {control.unit}
                </output>
              </div>
            )
          })}
      </div>
    </div>
  )
}
