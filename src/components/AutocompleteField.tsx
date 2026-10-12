import { useEffect, useId, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import '../css/AutocompleteField.css'

type AutocompleteFieldProps = {
  label: string
  options: readonly string[]
  value: string
  error: string
  onChange: (value: string) => void
  onSelect: (option: string) => void
  onCommit: () => void
  optionStyle?: (option: string) => CSSProperties // e.g. draw each font name in its font
}

export function AutocompleteField({
  label,
  options,
  value,
  error,
  onChange,
  onSelect,
  onCommit,
  optionStyle,
}: AutocompleteFieldProps) {
  const id = useId()
  const listId = `${id}-list`
  const errorId = `${id}-error`
  const [open, setOpen] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)

  // The list shows about six options; when it opens, it scrolls to the chosen one.
  // (`?.`: jsdom, used by the tests, has no scrollIntoView.)
  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest' })
  }, [open])

  // A value that is already a valid option shows the whole list, so the user can switch.
  const typed = value.trim().toLowerCase()
  const matches = options.includes(value)
    ? options
    : options.filter((option) => option.toLowerCase().includes(typed))

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    setOpen(false)
    onCommit()
  }

  return (
    <div className="autocomplete-field">
      <label htmlFor={id}>{label}</label>
      {/* Anchors the floating list to the field, so it never pushes the rest of the form */}
      <div className="autocomplete-control">
        <input
          id={id}
          type="text"
          role="combobox"
          value={value}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={error !== ''}
          aria-describedby={error ? errorId : undefined}
          style={error ? { borderColor: 'red' } : undefined}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value)
            setOpen(true)
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            setOpen(false)
            onCommit()
          }}
        />
        {open && (
          <ul id={listId} ref={listRef} className="autocomplete-list" role="listbox" aria-label={label}>
            {matches.length > 0 ? (
              matches.map((option) => (
                <li
                  key={option}
                  role="option"
                  aria-selected={option === value}
                  style={optionStyle?.(option)}
                  // Keep focus in the input so blur does not fire before the click.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onSelect(option)
                    setOpen(false)
                  }}
                >
                  {option}
                </li>
              ))
            ) : (
              <li role="option" aria-selected={false} aria-disabled="true">
                No results found
              </li>
            )}
          </ul>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
