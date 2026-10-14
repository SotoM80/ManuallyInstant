import { useLayoutEffect, useRef } from 'react'
import type { RefObject } from 'react'

// Same feel as the accordion it moves with: settles slowly and never overshoots
const DURATION = 500
const EASING = 'cubic-bezier(0.16, 1, 0.3, 1)' // --ease-smooth

// When the children of `list` change order, each one glides from its old spot to the new one
// (the FLIP technique: First, Last, Invert, Play). Only the list moves, unlike a View
// Transition of the whole page, so it never fights the accordion scrolling next to it.
// `order` is a key of the current order; every child needs a `data-key`.
export function useReorderGlide(list: RefObject<HTMLElement | null>, order: string) {
  // Where each child was after the last render, relative to the list (so scrolling is ignored)
  const spots = useRef(new Map<string, { x: number; y: number }>())
  const lastOrder = useRef(order)

  useLayoutEffect(() => {
    const element = list.current
    if (!element) return
    const box = element.getBoundingClientRect()
    const children = Array.from(element.children) as HTMLElement[]
    const before = spots.current
    const reordered = order !== lastOrder.current
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    spots.current = new Map()
    for (const child of children) {
      const key = child.dataset.key
      if (!key) continue
      const rect = child.getBoundingClientRect()
      const spot = { x: rect.left - box.left, y: rect.top - box.top }
      spots.current.set(key, spot)

      const old = before.get(key)
      if (!reordered || reduceMotion || !old || typeof child.animate !== 'function') continue
      const dx = old.x - spot.x
      const dy = old.y - spot.y
      if (dx === 0 && dy === 0) continue
      child.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
        duration: DURATION,
        easing: EASING,
      })
    }
    lastOrder.current = order
  })
}
