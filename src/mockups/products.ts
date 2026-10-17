import type { MockupGroup, MockupProduct } from './types'

// The groups of the list, in order (see specs/mockups.md)
export const MOCKUP_GROUPS: { group: MockupGroup; label: string }[] = [
  { group: 'stationery', label: 'Stationery' },
  { group: 'apparel', label: 'Apparel & bags' },
  { group: 'objects', label: 'Objects' },
  { group: 'screens', label: 'Screens' },
]

// The products, in the order of the list. Each one is plain data: shapes in its own viewBox and
// the box where the logo goes (ADR 0013). No <defs> or ids: a product is drawn several times at once.
export const MOCKUP_PRODUCTS: MockupProduct[] = [
  {
    kind: 'illustration',
    id: 'business-card',
    name: 'Business card',
    group: 'stationery',
    color: '#FFFFFF',
    colorLabel: 'Product color',
    viewBox: [120, 80],
    parts: [
      // A second card behind, tilted, with its shadow
      { d: 'M36.1 21.3 L105.2 32.2 L98.9 71.7 L29.8 60.8 Z', fill: 'shade', opacity: 0.12 },
      { d: 'M34.6 18.8 L103.7 29.7 L97.4 69.2 L28.3 58.3 Z', fill: 'product', outline: true },
      { d: 'M34.6 18.8 L103.7 29.7 L97.4 69.2 L28.3 58.3 Z', fill: 'shade', opacity: 0.06 },
      // The front card, straight, with its shadow
      { d: 'M17 16 H89 V60 H17 Z', fill: 'shade', opacity: 0.16 },
      { d: 'M14 13 H86 V57 H14 Z', fill: 'product', outline: true },
      { d: 'M14 13 H86 V16 H14 Z', fill: 'light', opacity: 0.5 },
    ],
    logo: { x: 30, y: 23, width: 40, height: 24 },
  },
  {
    kind: 'illustration',
    id: 't-shirt',
    name: 'T-shirt',
    group: 'apparel',
    color: '#FFFFFF',
    colorLabel: 'Product color',
    viewBox: [100, 100],
    parts: [
      {
        d: 'M30 12 L40 8 Q50 15 60 8 L70 12 L88 25 L80 39 L72 34 L72 90 Q50 94 28 90 L28 34 L20 39 L12 25 Z',
        fill: 'product',
        outline: true,
      },
      // The inside of the collar, the folds under the sleeves and the shaded side
      { d: 'M40 8 Q50 15 60 8 Q57 18 50 18 Q43 18 40 8 Z', fill: 'shade', opacity: 0.2 },
      { d: 'M28 34 L28 46 Q30.5 40 28 34 Z', fill: 'shade', opacity: 0.18 },
      { d: 'M72 34 L72 46 Q69.5 40 72 34 Z', fill: 'shade', opacity: 0.18 },
      { d: 'M72 34 L72 90 Q69 90.6 66 91 L67.5 38 Z', fill: 'shade', opacity: 0.07 },
      { d: 'M28 34 L28 90 Q30 90.4 32 90.7 L31 38 Z', fill: 'light', opacity: 0.35 },
    ],
    logo: { x: 38, y: 28, width: 24, height: 18 },
  },
  {
    kind: 'illustration',
    id: 'mug',
    name: 'Mug',
    group: 'objects',
    color: '#FFFFFF',
    colorLabel: 'Product color',
    viewBox: [100, 90],
    parts: [
      // The shadow on the table, the handle, then the body
      { d: 'M18 82 Q46 88 74 82 Q46 86 18 82 Z', fill: 'shade', opacity: 0.18 },
      { d: 'M72 30 C91 30 91 66 72 66 L72 58 C82 58 82 38 72 38 Z', fill: 'product', outline: true },
      { d: 'M20 18 L72 18 L72 74 Q72 82 64 82 L28 82 Q20 82 20 74 Z', fill: 'product', outline: true },
      // The inside of the mug, a light down the left side and a shadow down the right
      { d: 'M20 18 A26 5 0 0 0 72 18 A26 5 0 0 0 20 18 Z', fill: 'shade', opacity: 0.28 },
      { d: 'M25 23 L29 23 L29 77 L25 77 Z', fill: 'light', opacity: 0.45 },
      { d: 'M64 18 L72 18 L72 74 Q72 82 64 82 Z', fill: 'shade', opacity: 0.08 },
    ],
    logo: { x: 32, y: 34, width: 30, height: 30 },
  },
]

