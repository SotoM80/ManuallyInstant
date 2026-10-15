import type { LogoData, MarkType } from '../types'

// Text of the three Logo pages. Fixed, normative sentences with the user's data filled in
// (no AI: the app is frontend only, see docs/adr). Each function returns plain strings, so
// the pages only decide where they go.

export const MARK_TYPES: MarkType[] = ['Logotype', 'Imagotype', 'Isologo', 'Isotype']

// The brand may use several kinds of mark; Imagotype is chosen at the start.
export const DEFAULT_MARK_TYPES: MarkType[] = ['Imagotype']

// How each kind of mark is shown. Isotype and Logotype go with their other common name,
// since both are used in the industry (isotipo = brandmark, logotipo = wordmark).
export const MARK_TYPE_LABELS: Record<MarkType, string> = {
  Logotype: 'Logotype / Wordmark',
  Imagotype: 'Imagotype',
  Isologo: 'Isologo',
  Isotype: 'Isotype / Brandmark',
}

// What each kind of mark is, as the end of "{brand} is a {mark type}: ..."
export const MARK_TYPE_DEFINITIONS: Record<MarkType, string> = {
  Logotype: 'a mark built only from typography, where the brand name itself is the symbol',
  Imagotype:
    'an isotype / brandmark and a logotype / wordmark that work together, yet can also be read apart from each other',
  Isologo:
    'an isotype / brandmark and a logotype / wordmark fused into one single shape that cannot be separated',
  Isotype: 'a mark made only of a symbol, recognisable without the brand name',
}

// "an Imagotype", "an Isologo", "a Logotype"
function withArticle(word: string) {
  return /^[aeiou]/i.test(word) ? `an ${word}` : `a ${word}`
}

// The usage is written as the end of "Use the X version ..."; a trailing period is dropped
// so the sentence does not end with two.
function sentenceEnd(text: string) {
  return text.trim().replace(/\.+$/, '')
}

// 1.1 Philosophy
export function philosophyText(data: LogoData) {
  return [
    `The identity of ${data.brandName} is built on a clear idea:`,
    data.concept.trim(),
    'Every decision of its design follows from this idea, and every application of the brand should keep it alive.',
  ]
}

// "a Logotype", "an Isotype and a Logotype", "a Logotype, an Imagotype and an Isotype"
function listOfMarks(types: MarkType[]) {
  const words = types.map((type) => withArticle(MARK_TYPE_LABELS[type]))
  return words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words.at(-1)}` : words[0]
}

// 1.2 Anatomy: one sentence before the cards. With a single mark it defines it;
// with several it names them (each card then shows its own name and role).
export function anatomyText(data: LogoData) {
  const types = data.marks.map((mark) => mark.type)
  if (types.length === 1) {
    const [type] = types
    return `${data.brandName} is ${withArticle(MARK_TYPE_LABELS[type])}: ${MARK_TYPE_DEFINITIONS[type]}.`
  }
  return `${data.brandName} works with ${listOfMarks(types)}. Each one has its own role:`
}

// The name a version is shown with: its own, or "Primary" / "Version 2"… while it is empty
// (the preview is live, so a sentence must never show a gap).
export function versionName(name: string, index: number) {
  return name.trim() || (index === 0 ? 'Primary' : `Version ${index + 1}`)
}

// 2.1 Primary version: the first variant
export function primaryText(data: LogoData) {
  const name = versionName(data.variants[0]?.name ?? '', 0)
  const brand = data.brandName || 'the brand'
  return `The ${name} version is the master configuration of ${brand}. It is the default choice in every application, and the other versions are only used where it does not fit.`
}

// 2.3 Usage rules, one imperative sentence per variant. A version with no "use for" yet
// has no rule (the page shows a placeholder when none has one).
export function usageRules(data: LogoData) {
  return data.variants.flatMap((variant, index) =>
    variant.usage.trim() ? [`Use the ${versionName(variant.name, index)} version ${sentenceEnd(variant.usage)}.`] : [],
  )
}

// Densities of the construction grid the app draws: how many squares fit across the logo
export const GRID_MODULES = [12, 16, 24] as const
export const DEFAULT_GRID_MODULES = 16

// How many modules X measures. The same X sets the clear space (3.1) and the margin of the
// grid (3.2), so both blocks show the same measure.
export const GRID_X_OPTIONS = [1, 1.5, 2, 3] as const
export const DEFAULT_GRID_X = 1

// What X measures until the user writes their own (also the starting value of the form)
export const DEFAULT_CLEAR_SPACE_UNIT = 'the height of the letter X'

// 3.1 Clear space. With Unit X empty, the default keeps the sentence whole.
export function clearSpaceText(data: LogoData) {
  const unit = sentenceEnd(data.clearSpaceUnit) || DEFAULT_CLEAR_SPACE_UNIT
  return `The logo must always be surrounded by a free area that keeps it legible and gives it visual impact. No text, image or edge may enter this area. Its width is measured with the base unit X, which equals ${unit}.`
}

// 3.2 Construction grid
export const GRID_TEXT =
  'The elements of the logo keep a fixed geometric proportion between them, which must never be altered, stretched or redrawn. Always reproduce the logo from the original files, following the construction grid.'

// 3.3 Minimum sizes
export function minSizeRules(data: LogoData) {
  return [
    {
      label: 'Digital media',
      text: `The minimum size is ${data.minDigitalPx} px high. The full logo must not be used below this size.`,
    },
    {
      label: 'Print media',
      text: `The minimum size is ${data.minPrintMm} mm high. For low-resolution printing, check a physical proof first.`,
    },
  ]
}
