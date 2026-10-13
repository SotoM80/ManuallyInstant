import type { ChangeEvent } from 'react'
import { IMAGE_TYPES } from '../utils/validation'

// A file field for one image (Cover logo, Logo versions, construction grid).
type ImageFieldProps = {
  id: string
  label: string
  hideLabel?: boolean // the label is still read by screen readers, just not drawn
  fileName: string | null // null → "No file chosen"
  error: string
  onChange: (file: File | null) => void
}

export function ImageField({ id, label, hideLabel = false, fileName, error, onChange }: ImageFieldProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.files?.[0] ?? null)
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
      </div>
      {error && (
        <p id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </>
  )
}
