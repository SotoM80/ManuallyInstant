import {
  DEFAULT_MOCKUPS,
  MAX_MOCKUPS,
  chosenVersion,
  mockupLogo,
  mockupsBrand,
  setMockupColor,
  setMockupVersion,
  toggleMockup,
  versionOptions,
} from '../src/mockups/mockups';
import { MOCKUP_PRODUCTS } from '../src/mockups/products';
import type { Mockups } from '../src/mockups/types';
import type { CoverData, LogoData } from '../src/types';

// Spec: specs/mockups.md
const image = (name: string) => ({ url: `blob:${name}`, name });

function logoWith(variants: LogoData['variants']): LogoData {
  return {
    brandName: 'VOLTA',
    concept: '',
    marks: [],
    variants,
    clearSpaceUnit: '',
    minDigitalPx: 32,
    minPrintMm: 15,
    grid: null,
    gridModules: 16,
    gridX: 1,
    rulerTop: [],
    rulerSide: [],
  };
}

const VERSIONS = logoWith([
  { id: 0, name: 'Horizontal', usage: '', image: image('horizontal.png') },
  { id: 4, name: 'Negative', usage: '', image: image('negative.png') },
  { id: 7, name: '', usage: '', image: null },
]);
const COVER_LOGO = { url: 'blob:cover.png' };

describe('the products (ADR 0013)', () => {
  it.each(MOCKUP_PRODUCTS.map((product) => [product.name, product] as const))(
    '%s has its logo box inside its viewBox, and a part painted with its color',
    (_, product) => {
      const [width, height] = product.viewBox;
      const box = product.logo;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(box.y + box.height).toBeLessThanOrEqual(height);
      expect(product.parts.some((part) => part.fill === 'product')).toBe(true);
      expect(product.color).toMatch(/^#[0-9A-F]{6}$/);
    },
  );

  it('have unique ids', () => {
    const ids = MOCKUP_PRODUCTS.map((product) => product.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('DEFAULT_MOCKUPS', () => {
  it('ticks one product per group, in the order of the list, with the default colors (scenario 1)', () => {
    expect(DEFAULT_MOCKUPS.chosen).toEqual(
      MOCKUP_PRODUCTS.map((product) => product.id).filter((id) => ['business-card', 't-shirt', 'mug', 'phone'].includes(id)),
    );
    for (const product of MOCKUP_PRODUCTS) {
      expect(DEFAULT_MOCKUPS.settings[product.id]).toMatchObject({ color: product.color, version: null });
    }
  });
});

describe('toggleMockup', () => {
  const none: Mockups = { ...DEFAULT_MOCKUPS, chosen: [] };

  it('keeps the order of the list, whatever the order of the clicks (scenario 4)', () => {
    const ticked = toggleMockup(toggleMockup(toggleMockup(none, 'mug'), 'business-card'), 't-shirt');
    expect(ticked.chosen).toEqual(['business-card', 't-shirt', 'mug']);
  });

  it(`ticks no more than ${MAX_MOCKUPS} (scenario 3)`, () => {
    const full: Mockups = { ...none, chosen: ['a', 'b', 'c', 'd'] };
    expect(toggleMockup(full, 'mug')).toBe(full);
    expect(toggleMockup(full, 'a').chosen).toEqual(['b', 'c', 'd']);
  });

  it('keeps the settings of a product that is unticked (scenario 12)', () => {
    const red = setMockupVersion(setMockupColor(DEFAULT_MOCKUPS, 'mug', '#E53935'), 'mug', 4);
    const again = toggleMockup(toggleMockup(red, 'mug'), 'mug');
    expect(again.chosen).toContain('mug');
    expect(again.settings.mug).toMatchObject({ color: '#E53935', version: 4 });
  });
});

describe('the logo of a mockup', () => {
  it('shows the chosen version (scenario 8)', () => {
    expect(mockupLogo(VERSIONS, COVER_LOGO, 4)).toEqual(image('negative.png'));
  });

  it('falls back to the Primary while the chosen version has no image, and keeps it chosen (scenario 9)', () => {
    expect(mockupLogo(VERSIONS, COVER_LOGO, 7)).toEqual(image('horizontal.png'));
    expect(chosenVersion(VERSIONS, 7)).toBe(7);
  });

  it('goes back to the Primary when the version was removed (scenario 10)', () => {
    const removed = logoWith([VERSIONS.variants[0], VERSIONS.variants[2]]);
    expect(chosenVersion(removed, 4)).toBeNull();
    expect(mockupLogo(removed, COVER_LOGO, 4)).toEqual(image('horizontal.png'));
  });

  it('uses the Cover logo when the Primary has no image, and nothing with no logo at all (scenario 11)', () => {
    const noImages = logoWith([{ id: 0, name: '', usage: '', image: null }]);
    expect(mockupLogo(noImages, COVER_LOGO, null)).toEqual(COVER_LOGO);
    expect(mockupLogo(null, COVER_LOGO, null)).toEqual(COVER_LOGO);
    expect(mockupLogo(null, null, null)).toBeNull();
  });

  it('never stores the Primary by its id', () => {
    expect(chosenVersion(VERSIONS, 0)).toBeNull();
  });
});

describe('versionOptions', () => {
  it('names the Primary after its version, and the others as on the Logo versions page', () => {
    expect(versionOptions(VERSIONS)).toEqual([
      { value: null, label: 'Horizontal (Primary)' },
      { value: 4, label: 'Negative' },
      { value: 7, label: 'Version 3' },
    ]);
    expect(versionOptions(null)).toEqual([{ value: null, label: 'Primary' }]);
  });
});

describe('mockupsBrand (scenario 14)', () => {
  const cover = { title: 'My Brand' } as CoverData;

  it('uses the brand name, else the Cover title, else nothing', () => {
    expect(mockupsBrand(VERSIONS, cover)).toBe('VOLTA');
    expect(mockupsBrand({ ...VERSIONS, brandName: '  ' }, cover)).toBe('My Brand');
    expect(mockupsBrand(null, null)).toBe('');
  });
});
