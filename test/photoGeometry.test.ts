import { clampPlacement, dragPlacement, fitLogo } from '../src/mockups/geometry';
import { addPhotoTemplates, findMockup, isPhotoTemplate, loadLocalTemplates, mockupCatalog } from '../src/mockups/catalog';
import { PHOTO_TEMPLATES } from '../src/mockups/templates';
import { DEFAULT_PLACEMENT, defaultSettings, setMockupBlend, setMockupPlacement, settingsFor, DEFAULT_MOCKUPS } from '../src/mockups/mockups';
import type { PhotoTemplate } from '../src/mockups/types';

// Spec: specs/mockups.md, Photo mockups (ADR 0014)
const AREA = { x: 100, y: 200, width: 400, height: 200 };

describe('the photo templates', () => {
  it.each(PHOTO_TEMPLATES.map((template) => [template.name, template] as const))(
    '%s has its mask and logo area inside the photo, a photo in public/mockups and a valid color',
    (_, template) => {
      const [width, height] = template.size;
      const inside = ([x, y]: [number, number]) => x >= 0 && y >= 0 && x <= width && y <= height;
      expect(template.mask.length).toBeGreaterThan(0);
      for (const polygon of template.mask) {
        expect(polygon.length).toBeGreaterThanOrEqual(3);
        expect(polygon.every(inside)).toBe(true);
      }
      const area = template.area;
      expect(inside([area.x, area.y]) && inside([area.x + area.width, area.y + area.height])).toBe(true);
      expect(template.image).toMatch(/^\/mockups\/[\w-]+\.jpe?g$/);
      expect(isPhotoTemplate(template)).toBe(true);
    },
  );
});

describe('fitLogo', () => {
  it('fits a wide logo to the width of its area, and a tall one to its height', () => {
    expect(fitLogo(AREA, 4, 1)).toEqual({ width: 400, height: 100 });
    expect(fitLogo(AREA, 1, 1)).toEqual({ width: 200, height: 200 });
    expect(fitLogo(AREA, 1, 0.5)).toEqual({ width: 100, height: 100 });
  });

});

describe('clampPlacement (scenario 19)', () => {
  it('keeps the logo inside its area', () => {
    // A square logo fills the area's height: it can only move across, by (400 − 200) / 2 / 400
    expect(clampPlacement(AREA, 1, { x: 0.9, y: 0.9, scale: 1, rotate: 0 })).toEqual({ x: 0.25, y: 0, scale: 1, rotate: 0 });
    expect(clampPlacement(AREA, 1, { x: -0.9, y: 0, scale: 0.5, rotate: 0 })).toMatchObject({ x: -0.375 });
  });

  it('keeps size and rotation within their limits', () => {
    expect(clampPlacement(AREA, 1, { x: 0, y: 0, scale: 9, rotate: 90 })).toMatchObject({ scale: 1.5, rotate: 45 });
    expect(clampPlacement(AREA, 1, { x: 0, y: 0, scale: 0, rotate: -90 })).toMatchObject({ scale: 0.2, rotate: -45 });
  });

  it('leaves less room to a turned logo', () => {
    const straight = clampPlacement(AREA, 1, { x: 1, y: 0, scale: 0.5, rotate: 0 });
    const turned = clampPlacement(AREA, 1, { x: 1, y: 0, scale: 0.5, rotate: 45 });
    expect(turned.x).toBeLessThan(straight.x);
  });
});

describe('dragPlacement', () => {
  it('turns a drag on the preview into a share of the surface', () => {
    // The preview shows the 1000 px photo 500 px wide: 50 px on screen are 100 photo pixels, a quarter of 400
    expect(dragPlacement(DEFAULT_PLACEMENT, 50, -20, 500, 1000, { width: 400, height: 200 })).toMatchObject({ x: 0.25, y: -0.2 });
  });
});

describe('the catalog', () => {
  const local: PhotoTemplate = { ...PHOTO_TEMPLATES[0], id: 'tote-local', name: 'Tote (local)', group: 'apparel' };

  it('lists the photo templates with the illustrations, by group', () => {
    const ids = mockupCatalog().map((item) => item.id);
    expect(ids.indexOf('business-card-photo')).toBeLessThan(ids.indexOf('t-shirt'));
  });

  it('adds templates for this session, once, in their group', () => {
    addPhotoTemplates([local, local]);
    const ids = mockupCatalog().map((item) => item.id);
    expect(ids.filter((id) => id === 'tote-local')).toHaveLength(1);
    expect(ids.indexOf('tote-local')).toBeLessThan(ids.indexOf('mug'));
    expect(findMockup('tote-local')).toMatchObject({ kind: 'photo' });
  });

  it('gives a template added later its default settings', () => {
    expect(settingsFor(DEFAULT_MOCKUPS, local)).toEqual(defaultSettings(local));
  });

  // A stand-in for fetch: jsdom has no Response
  const answer = (ok: boolean, data: unknown) => (async () => ({ ok, json: async () => data })) as unknown as typeof fetch;

  it('reads a local file, and adds nothing when it is missing or wrong', async () => {
    const before = mockupCatalog().length;
    await loadLocalTemplates(answer(false, null));
    await loadLocalTemplates(answer(true, [{ kind: 'photo' }]));
    await loadLocalTemplates(async () => {
      throw new Error('offline');
    });
    expect(mockupCatalog()).toHaveLength(before);
    await loadLocalTemplates(answer(true, [{ ...local, id: 'cap-local', group: 'apparel' }]));
    expect(mockupCatalog()).toHaveLength(before + 1);
  });
});

describe('placement and blend settings', () => {
  it('keeps them per product', () => {
    const moved = setMockupBlend(setMockupPlacement(DEFAULT_MOCKUPS, 'business-card-photo', { x: 0.1, y: 0, scale: 0.6, rotate: 10 }), 'business-card-photo', 'solid');
    expect(moved.settings['business-card-photo']).toMatchObject({
      placement: { x: 0.1, y: 0, scale: 0.6, rotate: 10 },
      blend: 'solid',
    });
    expect(moved.settings['t-shirt']).toMatchObject({ placement: DEFAULT_PLACEMENT, blend: 'printed' });
  });
});
