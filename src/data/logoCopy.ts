import type { LogoData, MarkType } from '../types'

// Text of the three Logo pages. Fixed, normative sentences with the user's data filled in
// (no AI: the app is frontend only, see docs/adr). Each function returns plain strings, so
// the pages only decide where they go.

export const MARK_TYPES: MarkType[] = ['Logotype', 'Imagotype', 'Isologo', 'Isotype']

// The brand may use several kinds of mark; Imagotype is chosen at the start.
export const DEFAULT_MARK_TYPES: MarkType[] = ['Imagotype']

// What each kind of mark is, as the end of "{brand} is a {mark type}: ..."
export const MARK_TYPE_DEFINITIONS: Record<MarkType, string> = {
  Logotype: 'a mark built only from typography, where the brand name itself is the symbol',
  Imagotype:
    'a symbol and a wordmark that work together, yet can also be read apart from each other',
  Isologo: 'a symbol and a wordmark fused into one single shape that cannot be separated',
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
  const words = types.map(withArticle)
  return words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words.at(-1)}` : words[0]
}

// 1.2 Anatomy: one sentence before the cards. With a single mark it defines it;
// with several it names them (each card then shows its own name and role).
export function anatomyText(data: LogoData) {
  const types = data.marks.map((mark) => mark.type)
  if (types.length === 1) {
    return `${data.brandName} is ${withArticle(types[0])}: ${MARK_TYPE_DEFINITIONS[types[0]]}.`
  }
  return `${data.brandName} works with ${listOfMarks(types)}. Each one has its own role:`
}

// 2.1 Primary version: the first variant
export function primaryText(data: LogoData) {
  const primary = data.variants[0]
  return `The ${primary.name} version is the master configuration of ${data.brandName}. It is the default choice in every application, and the other versions are only used where it does not fit.`
}

// 2.3 Usage rules, one imperative sentence per variant
export function usageRules(data: LogoData) {
  return data.variants.map((variant) => `Use the ${variant.name} version ${sentenceEnd(variant.usage)}.`)
}

// 3.1 Clear space
export function clearSpaceText(data: LogoData) {
  return `The logo must always be surrounded by a free area that keeps it legible and gives it visual impact. No text, image or edge may enter this area. Its width is measured with the base unit X, which equals ${sentenceEnd(data.clearSpaceUnit)}.`
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
