import { useMemo } from 'react'
import { ImageField } from './ImageField'
import { MoreArea } from './MoreArea'
import { SkinColorField } from './SkinColorField'
import { MAX_EXAMPLES, START_EXAMPLES, USAGE_KINDS } from '../data/usageOptions'
import { keepInPlace } from '../utils/scrollAnchor'
import { validateImage } from '../utils/validation'
import { NO_IMAGE, applyImage, chooseFile, isPending, shownFile, toImage, useLiveData } from '../utils/pendingImage'
import type { PendingImage } from '../utils/pendingImage'
import { useDraft } from '../utils/useDraft'
import type { PaletteColor, UsageData, UsageKind } from '../types'

// Form of the Usage section (see specs/usage.md): a group of examples for each page, Correct use
// and Incorrect use, that work like the versions of the Logo section. Text reaches the preview
// at once; each new image waits for its own Apply (ADRs 0007 and 0020).
type UsageFormProps = {
  onChange?: (usage: UsageData) => void
  palette?: PaletteColor[] | null // for the Background chips that copy a palette color
  // Optional owner of the form's fields (see useDraft)
  draft?: UsageDraft
  onDraftChange?: (draft: UsageDraft) => void
}

// `key` stays the same when other examples are removed, so React keeps each example's state
type ExampleRow = {
  key: number
  description: string
  image: PendingImage
  fileError: string
  background: string | null // behind its image on the page, none by default (specs/imagebackground.md)
}

type GroupState = {
  rows: ExampleRow[]
  openKey: number | null // null → every example folded
  touched: boolean // until then, the group sends null and its page shows its placeholder
}

// Everything the form shows. `nextKey` is kept too, so an example added later never reuses a key.
export type UsageDraft = {
  groups: Record<UsageKind, GroupState>
  nextKey: number
}

// Keys 0–3 for the first group, 4–7 for the second: unique across the whole form
function startGroup(offset: number): GroupState {
  return {
    rows: Array.from({ length: START_EXAMPLES }, (_, i) => newRow(offset + i)),
    openKey: offset,
    touched: false,
  }
}

const NO_USAGE_DRAFT: UsageDraft = {
  groups: { correct: startGroup(0), incorrect: startGroup(START_EXAMPLES) },
  nextKey: START_EXAMPLES * USAGE_KINDS.length,
}

export function UsageForm({ onChange, palette = null, draft: ownerDraft, onDraftChange }: UsageFormProps) {
  const [draft, update] = useDraft(NO_USAGE_DRAFT, ownerDraft, onDraftChange)
  const { groups } = draft

  const usage = useMemo<UsageData>(() => {
    const data = (group: GroupState) =>
      group.touched
        ? group.rows.map((row) => {
            const file = shownFile(row.image)
            return { id: row.key, description: row.description.trim(), image: file ? toImage(file) : null, background: row.background }
          })
        : null
    return { correct: data(groups.correct), incorrect: data(groups.incorrect) }
  }, [groups])
  useLiveData(usage, onChange)

  // Every change to a group touches it, so its page leaves its placeholder
  function change(kind: UsageKind, edit: (group: GroupState) => Partial<GroupState>) {
    update((prev) => ({
      groups: { ...prev.groups, [kind]: { ...prev.groups[kind], ...edit(prev.groups[kind]), touched: true } },
    }))
  }

  // `changes` may be built from the newest row, so two changes in one event build on each other
  function updateRow(kind: UsageKind, key: number, changes: (row: ExampleRow) => Partial<ExampleRow>) {
    change(kind, (group) => ({
      rows: group.rows.map((row) => (row.key === key ? { ...row, ...changes(row) } : row)),
    }))
  }

  // A new example opens, and the one that was open folds (like Add version)
  function addRow(kind: UsageKind) {
    if (groups[kind].rows.length >= MAX_EXAMPLES) return
    update((prev) => {
      const key = prev.nextKey
      const group = prev.groups[kind]
      return {
        groups: { ...prev.groups, [kind]: { ...group, rows: [...group.rows, newRow(key)], openKey: key, touched: true } },
        nextKey: key + 1,
      }
    })
  }

  function removeRow(kind: UsageKind, key: number) {
    change(kind, (group) => ({
      rows: group.rows.length > 1 ? group.rows.filter((row) => row.key !== key) : group.rows,
      openKey: null,
    }))
  }

  // Folding or unfolding is not a change of the manual: it does not touch the group
  function toggleRow(kind: UsageKind, key: number) {
    update((prev) => ({
      groups: { ...prev.groups, [kind]: { ...prev.groups[kind], openKey: prev.groups[kind].openKey === key ? null : key } },
    }))
  }

  // A wrong file is flagged as soon as it is chosen. A valid one waits for its Apply.
  function chooseRowFile(kind: UsageKind, row: ExampleRow, file: File | null) {
    updateRow(kind, row.key, (now) => ({
      image: chooseFile(now.image, file),
      fileError: file ? validateImage(file) : '',
    }))
  }

  // The example's Apply: only its own image reaches the page
  function applyRowImage(kind: UsageKind, row: ExampleRow) {
    updateRow(kind, row.key, (now) => ({ image: applyImage(now.image, now.fileError) }))
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
                        onChange={(event) => {
                          const description = event.target.value
                          updateRow(kind, row.key, () => ({ description }))
                        }}
                      />
                      <ImageField
                        id={`${id}-image`}
                        label={`${label} image`}
                        fileName={row.image.file?.name ?? null}
                        error={row.fileError}
                        onChange={(file) => chooseRowFile(kind, row, file)}
                        pending={isPending(row.image, row.fileError)}
                        onApply={() => applyRowImage(kind, row)}
                      />
                      <MoreArea label={`${label} image`}>
                        <SkinColorField
                          label={`${label} background`}
                          value={row.background}
                          onChange={(background) => updateRow(kind, row.key, () => ({ background }))}
                          palette={palette}
                          allowNone
                        />
                      </MoreArea>
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
  return { key, description: '', image: NO_IMAGE, fileError: '', background: null }
}
