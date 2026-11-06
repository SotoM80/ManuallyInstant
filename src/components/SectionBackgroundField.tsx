import { useId, useState } from 'react'
import { ImageField } from './ImageField'
import { SkinColorField } from './SkinColorField'
import { OPACITY } from '../skins/sections'
import { NO_IMAGE, applyImage, chooseFile, isPending, toImage } from '../utils/pendingImage'
import type { PendingImage } from '../utils/pendingImage'
import { validateImage } from '../utils/validation'
import type { ImageFit, SectionBackground, SectionId } from '../skins/types'
import type { PaletteColor } from '../types'

const FITS: { fit: ImageFit; label: string }[] = [
  { fit: 'cover', label: 'Cover' },
  { fit: 'contain', label: 'Contain' },
]

type SectionBackgroundFieldProps = {
  section: SectionId
  label: string // the section's name, e.g. "Logo" → "Logo background color"
  value: SectionBackground
  onChange: (change: Partial<SectionBackground>) => void // only the fields that change
  palette: PaletteColor[] | null
  sectionOpen: boolean // the group folds again whenever its section is closed
}

// The folded "Section background" group at the end of a section's form: a color (not on the
// Cover, which keeps its own), a picture with its own Apply, its Fit and its opacity
// (specs/sectionbackgrounds.md, ADR 0025). Color, Fit and opacity are live; only a new picture
// waits for its Apply (ADR 0020). Its controls are only mounted while open, like MoreArea's.
export function SectionBackgroundField({ section, label, value, onChange, palette, sectionOpen }: SectionBackgroundFieldProps) {
  const [open, setOpen] = useState(false)
  // Folds when the section closes, so it is folded every time the section is opened again
  const [wasSectionOpen, setWasSectionOpen] = useState(sectionOpen)
  if (wasSectionOpen !== sectionOpen) {
    setWasSectionOpen(sectionOpen)
    if (!sectionOpen) setOpen(false)
  }
  // The file chosen last, waiting for Apply; kept here so folding the group does not lose it
  const [picture, setPicture] = useState<{ image: PendingImage; error: string }>({ image: NO_IMAGE, error: '' })
  const bodyId = useId()
  const id = `section-${section}-background`
  const name = `${label} background`

  function choose(file: File | null) {
    setPicture((prev) => ({ image: chooseFile(prev.image, file), error: file ? validateImage(file) : '' }))
  }

  function apply() {
    const image = applyImage(picture.image, picture.error)
    setPicture({ ...picture, image })
    if (image.shown) onChange({ image: toImage(image.shown) })
  }

  function remove() {
    setPicture({ image: NO_IMAGE, error: '' })
    onChange({ image: null })
  }

  return (
    <div className="section-background" data-open={open}>
      <button
        type="button"
        className="section-background-toggle"
        aria-expanded={open}
        aria-controls={bodyId}
        aria-label={`${label} section background`}
        onClick={() => setOpen((prev) => !prev)}
      >
        Section background
        <span className="more-area-chevron" aria-hidden="true" />
      </button>
      <div id={bodyId} className="section-background-body" hidden={!open} inert={!open}>
        {open && (
          <>
            {section !== 'cover' && (
              <SkinColorField<string | null>
                label={`${name} color`}
                value={value.color}
                onChange={(color) => onChange({ color })}
                palette={palette}
                allowNone
                noneName="Skin's"
                noneTitle="Use the Skin's Page background"
              />
            )}

            <ImageField
              id={`${id}-image`}
              label={`${name} image`}
              fileName={picture.image.file?.name ?? value.image?.name ?? null}
              error={picture.error}
              onChange={choose}
              pending={isPending(picture.image, picture.error)}
              onApply={apply}
            />
            {value.image && (
              <button type="button" className="section-background-remove" aria-label={`Remove ${name} image`} onClick={remove}>
                Remove
              </button>
            )}

            <fieldset className="segmented-control">
              <legend>Fit</legend>
              {FITS.map((option) => (
                <label key={option.fit}>
                  <input
                    type="radio"
                    name={`${id}-fit`}
                    value={option.fit}
                    aria-label={`${name} fit: ${option.label}`}
                    checked={value.fit === option.fit}
                    onChange={() => onChange({ fit: option.fit })}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </fieldset>

            <div className="skin-control">
              <label htmlFor={`${id}-opacity`}>Opacity</label>
              <input
                id={`${id}-opacity`}
                type="range"
                aria-label={`${name} opacity`}
                min={OPACITY.min}
                max={OPACITY.max}
                step={OPACITY.step}
                value={value.opacity}
                onChange={(event) => onChange({ opacity: Number(event.target.value) })}
              />
              <output htmlFor={`${id}-opacity`}>{value.opacity}%</output>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
