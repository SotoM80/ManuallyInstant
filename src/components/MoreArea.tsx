import { useId, useState } from 'react'
import type { ReactNode } from 'react'

type MoreAreaProps = {
  label: string // the field it belongs to, e.g. "Version 1 image" → "More for Version 1 image"
  children: ReactNode
}

// A folded area under an image field, for the settings used less often (its Background, see
// specs/imagebackground.md). It starts folded; a folded area can't be reached (inert).
// Its content is only mounted while open: a form has one per image (up to ~36), and keeping
// every color picker mounted made each change of the manual about 3 times slower.
export function MoreArea({ label, children }: MoreAreaProps) {
  const [open, setOpen] = useState(false)
  const bodyId = useId()
  return (
    <div className="more-area" data-open={open}>
      <button
        type="button"
        className="more-area-toggle"
        aria-expanded={open}
        aria-controls={bodyId}
        aria-label={`More for ${label.replace(/\s*\(optional\)$/, '')}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        More
        <span className="more-area-chevron" aria-hidden="true" />
      </button>
      <div id={bodyId} className="more-area-body" hidden={!open} inert={!open}>
        {open && children}
      </div>
    </div>
  )
}
