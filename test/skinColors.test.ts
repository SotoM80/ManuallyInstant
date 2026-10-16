import { newLayerColors } from '../src/skins/colors';
import { NO_SKIN } from '../src/skins/presets';

// Spec: specs/skins.md — the colors a new layer gets (copied, ADR 0011)
const RED = { id: 0, name: 'Red', hex: '#FF0000' };
const GREEN = { id: 1, name: 'Green', hex: '#00FF00' };
const BLUE = { id: 2, name: 'Blue', hex: '#0000FF' };
const NAVY_PAGES = { ...NO_SKIN, pageBackground: '#1A237E', pageText: '#FFFFFF' };

describe('newLayerColors', () => {
  it('copies the first two palette colors', () => {
    expect(newLayerColors([RED, GREEN, BLUE], NO_SKIN)).toEqual(['#FF0000', '#00FF00']);
  });

  it('uses the Page text and Page background colors with no palette (scenario 13)', () => {
    expect(newLayerColors(null, NO_SKIN)).toEqual(['#000000', '#FFFFFF']);
    expect(newLayerColors([], NAVY_PAGES)).toEqual(['#FFFFFF', '#1A237E']);
  });

  it('fills Color B with the Page background when the palette has one color', () => {
    expect(newLayerColors([RED], NO_SKIN)).toEqual(['#FF0000', '#FFFFFF']);
  });
});
