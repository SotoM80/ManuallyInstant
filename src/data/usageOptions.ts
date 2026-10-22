import type { UsageData, UsageKind } from '../types'

// The Usage section (see specs/usage.md): two groups of examples, one page each
export const START_EXAMPLES = 4
export const MAX_EXAMPLES = 6

export const NO_USAGE: UsageData = { correct: null, incorrect: null }

export const USAGE_KINDS: {
  kind: UsageKind
  label: string // the group, its page and what each example is announced as
  empty: string // the page's placeholder until its group is touched
  mark: string
  suggestions: string[] // grey hints of the first descriptions, never sent to the page
}[] = [
  {
    kind: 'correct',
    label: 'Correct use',
    empty: 'Your correct uses',
    mark: '✓',
    suggestions: ['On a light background', 'On a dark background', 'On a brand color', 'With enough clear space'],
  },
  {
    kind: 'incorrect',
    label: 'Incorrect use',
    empty: 'Your incorrect uses',
    mark: '✕',
    suggestions: ["Don't stretch the logo", "Don't rotate the logo", "Don't change its colors", "Don't add effects or shadows"],
  },
]

export function usageKind(kind: UsageKind) {
  return USAGE_KINDS.find((item) => item.kind === kind)!
}
