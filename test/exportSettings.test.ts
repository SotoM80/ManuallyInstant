import { EXPORT_SETTINGS, a4, emptySections, pdfFileName } from '../src/export/exportSettings';

// Spec: specs/export.md
describe('pdfFileName', () => {
  it.each([
    ['My Brand', 'print', 'my-brand-print.pdf'],
    ['My Brand!', 'web', 'my-brand-web.pdf'],
    ['  Café  Ñandú 2026 ', 'print', 'café-ñandú-2026-print.pdf'],
    ['', 'web', 'brand-manual-web.pdf'],
    [undefined, 'print', 'brand-manual-print.pdf'],
  ] as const)('names "%s" as %s → %s', (title, kind, name) => {
    expect(pdfFileName(title, kind)).toBe(name);
  });
});

describe('EXPORT_SETTINGS', () => {
  it('draws print at 300 dpi in PNG and web at 144 dpi in JPEG (scenarios 2 and 3)', () => {
    expect(EXPORT_SETTINGS.print).toMatchObject({ dpi: 300, image: 'png' });
    expect(EXPORT_SETTINGS.web).toMatchObject({ dpi: 144, image: 'jpeg', quality: 0.82 });
  });
});

describe('a4', () => {
  it('measures A4 in mm and in CSS pixels, standing or lying down (scenario 7)', () => {
    expect(a4('portrait')).toEqual({ mm: { width: 210, height: 297 }, px: { width: 794, height: 1123 } });
    expect(a4('landscape')).toEqual({ mm: { width: 297, height: 210 }, px: { width: 1123, height: 794 } });
  });
});

describe('emptySections', () => {
  it('lists the sections never touched, in their order (scenario 4)', () => {
    expect(emptySections({ cover: {}, logo: null, palette: null, typography: null })).toEqual([
      'Logo',
      'Colors',
      'Typography',
    ]);
    expect(emptySections({ cover: {}, logo: {}, palette: [], typography: {} })).toEqual([]);
  });
});
