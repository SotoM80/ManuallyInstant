import { useCallback, useState } from 'react'
import { NO_USAGE } from '../data/usageOptions'
import { DEFAULT_MOCKUPS } from '../mockups/mockups'
import type { Mockups } from '../mockups/types'
import { NO_SKIN } from '../skins/presets'
import type { Skin } from '../skins/types'
import { DEFAULT_TEMPLATE } from '../templates'
import type { TemplateId } from '../templates'
import { NO_GUIDES } from './guides'
import type { Guides } from './guides'
import type { BrandFonts, CoverData, LogoData, Orientation, PaletteColor, PreviewView, UsageData } from '../types'

// App keeps its state in three groups, by what each value is (see docs/refactors/0002).

// What goes into the PDF. Each section is null until it is touched for the first time.
export type ManualContent = {
  cover: CoverData | null
  logo: LogoData | null
  usage: UsageData // each group null until touched
  palette: PaletteColor[] | null
  typography: BrandFonts | null
  mockups: Mockups
  guides: Guides // clicked on the construction grid
}

export const NO_CONTENT: ManualContent = {
  cover: null,
  logo: null,
  usage: NO_USAGE,
  palette: null,
  typography: null,
  mockups: DEFAULT_MOCKUPS,
  guides: NO_GUIDES,
}

// How the pages look. It never changes the content.
export type ManualDesign = {
  template: TemplateId
  skin: Skin
}

export const DEFAULT_DESIGN: ManualDesign = {
  template: DEFAULT_TEMPLATE,
  skin: NO_SKIN,
}

// How the preview is seen on screen. Never exported.
export type PreviewSettings = {
  orientation: Orientation
  previewView: PreviewView
  // The open section's pages come first, and the section beside them (ADR 0032)
  followSection: boolean
}

export const DEFAULT_VIEW: PreviewSettings = {
  orientation: 'landscape',
  previewView: 'grid',
  followSection: true,
}

// A new value, or a change made from the newest one (as React's setState takes)
export type Update<T> = T | ((prev: T) => T)

// Changes one field of a group
export type GroupChange<G> = <K extends keyof G>(key: K, update: Update<G[K]>) => void

// One state object and a stable function that changes one of its fields. It always starts from
// the newest object, so two changes close together never undo each other. No field holds a
// function, so a function is always an update.
export function useGroup<G extends object>(initial: G): [G, GroupChange<G>] {
  const [group, setGroup] = useState(initial)
  const change = useCallback<GroupChange<G>>((key, update) => {
    setGroup((prev) => {
      const value = typeof update === 'function' ? (update as (p: G[typeof key]) => G[typeof key])(prev[key]) : update
      return { ...prev, [key]: value }
    })
  }, [])
  return [group, change]
}
