import { useMemo, useRef, useState } from 'react'
import { ImageField } from './ImageField'
import { MAX_EXAMPLES, START_EXAMPLES, USAGE_KINDS } from '../data/usageOptions'
import { keepInPlace } from '../utils/scrollAnchor'
import { validateImage } from '../utils/validation'
import { NO_IMAGE, chooseFile, isPending, shownFile, toImage, useLiveData, usePendingReport } from '../utils/pendingImage'
import type { PendingImage } from '../utils/pendingImage'
import type { UsageData, UsageKind } from '../types'

// Form of the Usage section (see specs/usage.md): a group of examples for each page, Correct use
// and Incorrect use, that work like the versions of the Logo section. Text reaches the preview
// at once; new images wait for Apply (ADR 0007).
type UsageFormProps = {
  onChange?: (usage: UsageData) => void
  applyCount?: number // how many times Apply was pressed
  onPendingChange?: (pending: boolean) => void // a new image is waiting for Apply
}

// `key` stays the same when other examples are removed, so React keeps each example's state
type ExampleRow = {
  key: number
  description: string
  image: PendingImage
  fileError: string
}

type GroupState = {
  rows: ExampleRow[]
  openKey: number | null // null → every example folded
  touched: boolean // until then, the group sends null and its page shows its placeholder
}

export function UsageForm({ onChange, applyCount = 0, onPendingChange }: UsageFormProps) {
  const nextKey = useRef(START_EXAMPLES * USAGE_KINDS.length)
  const [groups, setGroups] = useState<Record<UsageKind, GroupState>>(() => {
    // Keys 0–3 for the first group, 4–7 for the second: unique across the whole form
    const start = (offset: number): GroupState => ({
      rows: Array.from({ length: START_EXAMPLES }, (_, i) => newRow(offset + i)),
      openKey: offset,
      touched: false,
    })
    return { correct: start(0), incorrect: start(START_EXAMPLES) }
  })

  const usage = useMemo<UsageData>(() => {
    const data = (group: GroupState) =>
      group.touched
        ? group.rows.map((row) => {
            const file = shownFile(row.image, applyCount, row.fileError)
            return { id: row.key, description: row.description.trim(), image: file ? toImage(file) : null }
          })
        : null
    return { correct: data(groups.correct), incorrect: data(groups.incorrect) }
  }, [groups, applyCount])
  useLiveData(usage, onChange)

  const pending = Object.values(groups).some((group) =>
    group.rows.some((row) => isPending(row.image, applyCount, row.fileError)),
  )
  usePendingReport(pending, onPendingChange)

  // Every change to a group touches it, so its page leaves its placeholder
  function change(kind: UsageKind, update: (group: GroupState) => Partial<GroupState>) {
    setGroups((prev) => ({ ...prev, [kind]: { ...prev[kind], ...update(prev[kind]), touched: true } }))
  }

  function updateRow(kind: UsageKind, key: number, changes: Partial<ExampleRow>) {
    change(kind, (group) => ({ rows: group.rows.map((row) => (row.key === key ? { ...row, ...changes } : row)) }))
  }

  // A new example opens, and the one that was open folds (like Add version)
  function addRow(kind: UsageKind) {
    if (groups[kind].rows.length >= MAX_EXAMPLES) return
    const key = nextKey.current++
    change(kind, (group) => ({ rows: [...group.rows, newRow(key)], openKey: key }))
  }

  function removeRow(kind: UsageKind, key: number) {
    change(kind, (group) => ({
      rows: group.rows.length > 1 ? group.rows.filter((row) => row.key !== key) : group.rows,
      openKey: null,
    }))
  }

  // Folding or unfolding is not a change of the manual: it does not touch the group
  function toggleRow(kind: UsageKind, key: number) {
    setGroups((prev) => ({
      ...prev,
      [kind]: { ...prev[kind], openKey: prev[kind].openKey === key ? null : key },
    }))
  }

  // A wrong file is flagged as soon as it is chosen. A valid one waits for Apply.
  function chooseRowFile(kind: UsageKind, row: ExampleRow, file: File | null) {
    updateRow(kind, row.key, {
      image: chooseFile(row.image, file, applyCount, row.fileError),
      fileError: file ? validateImage(file) : '',
    })
  }

  return (
    <form onSubmit={(event) => event.preventDefault()} noValidate aria-label="Usage">
      {USAGE_KINDS.map(({ kind, label: groupLabel, suggestions }) => {
        const group = groups[kind]
        return (
          // data-area: which page the group fills (USAGE_AREA_PAGES), so it can come first
          <fieldset key={kind} className="logo-form-group" data-area={kind}>
            <legend>{groupLabel}</legend>
            {group.rows.map((row, index) => {
              const label = `${groupLabel} example ${index + 1}`
              const id = `usage-${kind}-${row.key}`
              const isOpen = group.openKey === row.key
              const bodyId = `${id}-body`
              const summaryId = `${id}-summary`
              return (
                <div key={row.key} className="palette-block" data-open={isOpen} data-invalid={Boolean(row.fileError)}>
                  {/* Folded or open, this row always shows the example's description and its file */}
                  <button
                    type="button"
                    className="palette-block-header"
                    aria-expanded={isOpen}
                    aria-controls={bodyId}
                    aria-label={label}
                    aria-describedby={summaryId}
                    onClick={(event) => {
                      keepInPlace(event.currentTarget) // the example above may fold
                      toggleRow(kind, row.key)
                    }}
                  >
                    <span className="palette-block-title">Example {index + 1}</span>
                    <span id={summaryId} className="palette-block-summary">
                      <span className="palette-block-name">{row.description.trim() || 'No description yet'}</span>
                      <span className="palette-block-name logo-version-file">{row.image.file?.name ?? 'No image'}</span>
                    </span>
                    <span className="palette-block-chevron" aria-hidden="true" />
                  </button>

                  {/* Always in the page so it can fold and unfold; inert while folded */}
                  <div id={bodyId} className="palette-block-body" inert={!isOpen}>
                    <div className="palette-block-inner">
                      <label htmlFor={`${id}-description`}>{`${label} description`}</label>
                      <input
                        id={`${id}-description`}
                        type="text"
                        value={row.description}
                        placeholder={suggestions[index] ?? ''}
                        onChange={(event) => updateRow(kind, row.key, { description: event.target.value })}
                      />
                      <ImageField
                        id={`${id}-image`}
                        label={`${label} image`}
                        fileName={row.image.file?.name ?? null}
                        error={row.fileError}
                        onChange={(file) => chooseRowFile(kind, row, file)}
                      />
                      {group.rows.length > 1 && (
                        <button
                          type="button"
                          className="palette-secondary-button"
                          onClick={() => removeRow(kind, row.key)}
                          aria-label={`Remove ${label}`}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            <button
              type="button"
              className="palette-secondary-button"
              aria-label={`Add example to ${groupLabel}`}
              onClick={(event) => {
                keepInPlace(event.currentTarget) // the open example above folds
                addRow(kind)
              }}
              disabled={group.rows.length >= MAX_EXAMPLES}
            >
              Add example
            </button>
          </fieldset>
        )
      })}
    </form>
  )
}

function newRow(key: number): ExampleRow {
  return { key, description: '', image: NO_IMAGE, fileError: '' }
}
