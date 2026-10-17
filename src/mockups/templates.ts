import type { PhotoTemplate } from './types'

// The photo templates the app ships (see specs/mockups.md, Photo mockups, and ADR 0014). Their
// photos are in public/mockups/ with their license in public/mockups/LICENSES.md. Measures are
// in the photo's pixels.
export const PHOTO_TEMPLATES: PhotoTemplate[] = [
  {
    kind: 'photo',
    id: 'business-card-photo',
    name: 'Business card (photo)',
    group: 'stationery',
    image: '/mockups/business-card.jpg',
    size: [1600, 2400],
    // Both cards, so both take the color; the logo goes on the top one
    mask: [
      [
        [218, 514],
        [1263, 498],
        [1270, 1095],
        [228, 1114],
      ],
      [
        [246, 1335],
        [1276, 1326],
        [1275, 1909],
        [254, 1918],
      ],
    ],
    area: { x: 330, y: 600, width: 820, height: 410 },
    color: '#FFFFFF',
    colorLabel: 'Product color',
    tintable: true,
  },
]
