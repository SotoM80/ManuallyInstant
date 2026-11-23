import type { PhotoTemplate } from '../src/mockups/types';

// The app ships no photo template (src/mockups/templates.ts). The tests of photo mockups (the
// template editor, Blend, dragging the logo…) need one in the list, so every test file gets this
// one, as if the app shipped it (see test/setupTests.ts). Its photo is never loaded: jsdom has no
// WebGL and the tests mock the renderer.
export const TEST_PHOTO_TEMPLATE: PhotoTemplate = {
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
};
