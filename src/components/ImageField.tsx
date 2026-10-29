import { useState } from 'react'
import type { AnimationEvent, ChangeEvent } from 'react'
import { IMAGE_TYPES } from '../utils/validation'

// A file field for one image (Cover logo, Logo versions, construction grid). With `onApply`, its
// own Apply button sits after the file's name: it shows only this field's new image (ADR 0020).
type ImageFieldProps = {
  id: string
  label: string
  hideLabel?: boolean // the label is still read by screen readers, just not drawn
  fileName: string | null // null → "No file chosen"
  error: string
  onChange: (file: File | null) => void
  pending?: boolean // a valid new image waits for this field's Apply
  onApply?: () => void
}

// "Isotype image (optional)" → "Apply Isotype image", so every Apply has a name of its own
function applyName(label: string) {
  return `Apply ${label.replace(/\s*\(optional\)$/, '')}`
}

export function ImageField({ id, label, hideLabel = false, fileName, error, onChange, pending = false, onApply }: ImageFieldProps) {
  const [applied, setApplied] = useState(false)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.files?.[0] ?? null)
  }

  function handleApply() {
    onApply?.()
    setApplied(true)
  }

  // Back to idle when the button's own animation ends; the check (::after) has its own.
  function handleAppliedEnd(event: AnimationEvent<HTMLButtonElement>) {
    if (!event.pseudoElement) setApplied(false)
  }

  return (
    <>
      <label htmlFor={id} className={hideLabel ? 'visually-hidden' : undefined}>
        {label}
      </label>
      {/* The browser writes the native file button in the system's language, so it is
          hidden (still there for keyboard and screen readers) and drawn here in English. */}
      <div className="file-field">
        <input
          id={id}
          type="file"
          accept={IMAGE_TYPES.join(',')}
          onChange={handleChange}
          aria-invalid={error !== ''}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <label htmlFor={id} className="file-field-button" aria-hidden="true">
          Choose file
        </label>
        <span className="file-field-name" title={fileName ?? undefined} aria-hidden="true">
          {fileName ?? 'No file chosen'}
        </span>
        {onApply && (
          <button
            type="button"
            className="accent-button image-apply"
            aria-label={applyName(label)}
            disabled={!pending}
            onClick={handleApply}
            data-feedback={applied ? 'saved' : 'idle'}
            onAnimationEnd={handleAppliedEnd}
            title={pending ? 'Show this image in the manual' : 'Choose a new image to apply it'}
          >
            Apply
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </>
  )
}
