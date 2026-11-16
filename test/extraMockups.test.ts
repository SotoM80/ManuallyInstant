import {
  DEFAULT_MOCKUPS,
  MAX_EXTRA,
  chosenVersion,
  extraPageCount,
  extraPageLayout,
  extraPageOf,
  extraPagePhotos,
  mockupLogo,
  moveExtra,
  moveToOwnPage,
  pagesWith,
  parseVersionValue,
  placeNewMockup,
  removeExtra,
  setExtraLayout,
  setOwnPage,
  toggleMockup,
  versionValue,
} from '../src/mockups/mockups';
import { extraMockupsIndex, manualPages, orderPages, pageNumber } from '../src/data/manualSections';
import { sectionOfPage } from '../src/skins/sections';
import type { Mockups } from '../src/mockups/types';

// Spec: specs/mockups.md, More pages (ADR 0036)
const photo = (id: string) => ({ id, color: '#FFFFFF' });
const ORDER = ['a', 'b', 'c', 'd', 'e', 'p1', 'p2', 'p3'];
const FULL: Mockups = { chosen: ['a', 'b', 'c', 'd'], settings: {} };

function withExtra(...ids: string[]): Mockups {
  return { ...FULL, extra: ids };
}

describe('placeNewMockup', () => {
  it('ticks a new template when no mockup is ticked', () => {
    const none: Mockups = { chosen: [], settings: {} };
    const placed = placeNewMockup(none, photo('b'), ORDER);
    expect(placed.place).toBe('page');
    expect(placed.mockups.chosen).toEqual(['b']);
    expect(placed.mockups.extra ?? []).toEqual([]);
  });

  it('puts it on the extra pages, with No logo, when mockups are already ticked (scenario 33)', () => {
    const some: Mockups = { chosen: ['a', 'c'], settings: {} };
    expect(placeNewMockup(some, photo('p1'), ORDER).place).toBe('extra');
    const placed = placeNewMockup(FULL, photo('p1'), ORDER);
    expect(placed.place).toBe('extra');
    expect(placed.mockups.chosen).toEqual(FULL.chosen);
    expect(placed.mockups.extra).toEqual(['p1']);
    expect(placed.mockups.settings.p1.version).toBe('none');
  });

  it('adds nothing once the extra pages hold the most photos', () => {
    const many = withExtra(...Array.from({ length: MAX_EXTRA }, (_, i) => `x${i}`));
    const placed = placeNewMockup(many, photo('p1'), ORDER);
    expect(placed.place).toBe('full');
    expect(placed.mockups).toBe(many);
  });

  it('leaves a template already placed where it is', () => {
    const placed = placeNewMockup(withExtra('p1'), photo('p1'), ORDER);
    expect(placed.mockups.extra).toEqual(['p1']);
  });
});

describe('the extra pages', () => {
  it('a page per photo by default, then a grid (scenario 34)', () => {
    const three = withExtra('p1', 'p2', 'p3');
    expect(extraPageCount(three)).toBe(3);
    const two = setExtraLayout(three, { cols: 2 });
    expect(extraPageCount(two)).toBe(2);
    expect(extraPagePhotos(two, 1)).toEqual(['p1', 'p2']);
    expect(extraPagePhotos(two, 2)).toEqual(['p3']);
    expect(extraPageCount(DEFAULT_MOCKUPS)).toBe(0);
  });

  it('gives a photo marked Own page a whole page, whatever the grid (scenario 41)', () => {
    const grid = setExtraLayout(withExtra('A', 'B', 'C'), { cols: 2 });
    const own = setOwnPage(grid, 'A', true);
    expect(extraPagePhotos(own, 1)).toEqual(['A']);
    expect(extraPagePhotos(own, 2)).toEqual(['B', 'C']);
    expect(extraPageLayout(own, 1)).toMatchObject({ cols: 1, rows: 1 });
    expect(extraPageLayout(own, 2)).toMatchObject({ cols: 2, rows: 1 });
    expect(extraPageOf(own, 'C')).toBe(2);
    // In the middle, it cuts the grid short
    const middle = setOwnPage(grid, 'B', true);
    expect([1, 2, 3].map((page) => extraPagePhotos(middle, page))).toEqual([['A'], ['B'], ['C']]);
    // Unticked, A and B share a page again; removed, it is no longer on its own
    expect(extraPagePhotos(setOwnPage(own, 'A', false), 1)).toEqual(['A', 'B']);
    expect(removeExtra(own, 'A').extraOwn).toEqual([]);
  });

  it('sends a photo ticked on the Mockups page back to a page of its own (scenario 43)', () => {
    const three: Mockups = { chosen: ['a', 'b', 'c'], settings: {}, extra: ['A', 'B'] };
    const ticked = toggleMockup(three, 'A', [...ORDER, 'A', 'B']);
    expect(ticked.chosen).toContain('A');
    expect(ticked.extra).toEqual(['B']);
    const moved = moveToOwnPage(setExtraLayout(ticked, { cols: 2 }), 'A');
    expect(moved.chosen).not.toContain('A');
    expect(moved.extra).toEqual(['B', 'A']);
    expect([1, 2].map((page) => extraPagePhotos(moved, page))).toEqual([['B'], ['A']]);
  });

  it('keeps the grid and the margin inside their limits', () => {
    const layout = setExtraLayout(DEFAULT_MOCKUPS, { cols: 9, rows: 0, margin: 35 }).extraLayout;
    expect(layout).toEqual({ cols: 3, rows: 1, margin: 20 });
  });

  it('moves and removes a photo (scenario 37)', () => {
    const moved = moveExtra(withExtra('A', 'B', 'C'), 'C', -1);
    expect(moved.extra).toEqual(['A', 'C', 'B']);
    expect(moveExtra(moved, 'A', -1)).toBe(moved);
    expect(removeExtra(moved, 'A').extra).toEqual(['C', 'B']);
  });

  it('ticking a photo of the extra pages moves it to the Mockups page (scenario 38)', () => {
    const room: Mockups = { chosen: ['a', 'b', 'c'], settings: {}, extra: ['p1'] };
    const ticked = toggleMockup(room, 'p1', ORDER);
    expect(ticked.chosen).toEqual(['a', 'b', 'c', 'p1']);
    expect(ticked.extra).toEqual([]);
  });
});

describe('No logo', () => {
  it('shows no logo, and keeps its choice in the select', () => {
    expect(mockupLogo(null, { url: 'blob:cover' }, 'none')).toBeNull();
    expect(chosenVersion(null, 'none')).toBe('none');
    expect(parseVersionValue(versionValue('none'))).toBe('none');
    expect(parseVersionValue(versionValue(null))).toBeNull();
    expect(parseVersionValue(versionValue(4))).toBe(4);
  });
});

describe('the page list', () => {
  it('adds the extra pages after the Mockups page, numbered after it', () => {
    expect(manualPages(0)).toHaveLength(10);
    expect(manualPages(2).slice(-3)).toEqual(['Mockups', 'Mockups 2', 'Mockups 3']);
    expect(pageNumber('Mockups 2')).toBe(11);
    expect(pageNumber('Mockups 3')).toBe(12);
    expect(pageNumber('Typography')).toBe(9);
    expect(extraMockupsIndex('Mockups')).toBeNull();
    expect(pagesWith(withExtra('p1', 'p2'))).toHaveLength(12);
  });

  it('puts them in the Mockups section, and orders them with the featured pages', () => {
    expect(sectionOfPage('Mockups 2')).toBe('mockups');
    expect(orderPages(['Mockups', 'Mockups 2'], 1).slice(0, 3)).toEqual(['Mockups', 'Mockups 2', 'Cover']);
  });
});
