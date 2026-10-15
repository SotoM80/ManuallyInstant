import { autoColorName, skinColors } from '../src/skins/colors';
import type { PaletteColor } from '../src/types';

// Spec: specs/skins.md, Section 2 — Colors (Color A and Color B, with Auto)
const FALLBACK = { ink: '#000000', background: '#FFFFFF' };
const RED = { id: 0, name: 'Red', hex: '#FF0000' };
const GREEN = { id: 1, name: 'Green', hex: '#00FF00' };
const BLUE = { id: 2, name: 'Blue', hex: '#0000FF' };

function colors(palette: PaletteColor[] | null, a: number | null, b: number | null) {
  return skinColors(palette, [a, b], FALLBACK);
}

describe('skinColors', () => {
  it('uses the first two palette colors on Auto', () => {
    expect(colors([RED, GREEN, BLUE], null, null)).toEqual(['#FF0000', '#00FF00']);
  });

  it('uses a chosen palette color (scenario 6)', () => {
    expect(colors([RED, GREEN, BLUE], BLUE.id, null)).toEqual(['#0000FF', '#00FF00']);
  });

  it('may use the same color twice', () => {
    expect(colors([RED, GREEN], RED.id, RED.id)).toEqual(['#FF0000', '#FF0000']);
  });

  it('falls back to the Typography and Background colors with no palette (scenario 7)', () => {
    expect(colors(null, null, null)).toEqual(['#000000', '#FFFFFF']);
    expect(colors([], null, null)).toEqual(['#000000', '#FFFFFF']);
  });

  it('fills Color B with the Background color when the palette has one color', () => {
    expect(colors([RED], null, null)).toEqual(['#FF0000', '#FFFFFF']);
  });

  it('keeps pointing at the same colors when one in the middle is removed (scenario 8)', () => {
    expect(colors([RED, BLUE], BLUE.id, RED.id)).toEqual(['#0000FF', '#FF0000']);
  });

  it('treats a removed color as Auto (scenario 9)', () => {
    expect(colors([RED, GREEN], BLUE.id, null)).toEqual(['#FF0000', '#00FF00']);
  });
});

describe('autoColorName', () => {
  it('names the palette color Auto is using, or the Cover color that fills in', () => {
    expect(autoColorName([RED, GREEN], 0)).toBe('Red');
    expect(autoColorName([RED, { ...GREEN, name: '' }], 1)).toBe('Color 2');
    expect(autoColorName([RED], 1)).toBe('Background color');
    expect(autoColorName(null, 0)).toBe('Typography color');
  });
});
