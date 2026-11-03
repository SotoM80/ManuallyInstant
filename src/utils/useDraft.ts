import { useRef, useState } from 'react'

// The fields a form shows (half-typed values and errors too). An owner above the routes (App)
// may keep them, so the form is filled again when the user comes back to the page
// (specs/navmenu.md, Invariants). Without an owner, the form keeps its own, like an <input>
// without `value`.
export function useDraft<T extends object>(empty: T, owned?: T, onOwnedChange?: (draft: T) => void) {
  const [own, setOwn] = useState(owned ?? empty)
  const draft = owned ?? own
  // The newest fields, so two changes in one event (select, then commit) build on each other.
  const latest = useRef(draft)

  function update(change: (prev: T) => Partial<T>) {
    const next = { ...latest.current, ...change(latest.current) }
    latest.current = next
    setOwn(next)
    onOwnedChange?.(next)
  }

  // Read in event handlers only, never while rendering.
  function current() {
    return latest.current
  }

  return [draft, update, current] as const
}
