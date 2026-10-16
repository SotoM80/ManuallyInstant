import {
  MAX_LAYERS,
  addLayer,
  layerNames,
  moveLayer,
  removeLayer,
  setLayerColor,
  setLayerParam,
  setOnCover,
  setPageColor,
  setVisible,
} from '../src/skins/layers';
import { NO_SKIN } from '../src/skins/presets';
import type { Skin } from '../src/skins/types';

const AB: [string, string] = ['#FF0000', '#0000FF'];
const add = (skin: Skin, preset: string) => addLayer(skin, preset, AB);

// Spec: specs/skins.md — the list of layers (ADR 0010)
function presets(skin: Skin) {
  return skin.layers.map((layer) => layer.preset);
}

describe('addLayer', () => {
  it('adds a layer with the default values and the given colors, on, not on the Cover (scenario 3)', () => {
    const [layer] = add(NO_SKIN, 'linear').layers;
    expect(layer).toEqual({
      id: 1,
      preset: 'linear',
      params: { angle: 135, intensity: 30 },
      colors: AB,
      visible: true,
      onCover: false,
    });
  });

  it('puts a new layer on top (scenario 4)', () => {
    expect(presets(add(add(NO_SKIN, 'linear'), 'dots'))).toEqual(['dots', 'linear']);
  });

  it(`adds no more than ${MAX_LAYERS} layers (scenario 9)`, () => {
    let skin = NO_SKIN;
    for (const id of ['linear', 'radial', 'dots', 'stripes', 'dots']) skin = add(skin, id);
    expect(skin.layers).toHaveLength(MAX_LAYERS);
  });

  it('never gives a removed id to a new layer', () => {
    const skin = add(add(NO_SKIN, 'linear'), 'dots'); // ids 1, 2
    const again = add(removeLayer(skin, 2), 'stripes');
    expect(again.layers.map((layer) => layer.id)).toEqual([3, 1]);
  });

  it('ignores a preset that does not exist', () => {
    expect(add(NO_SKIN, 'unknown')).toBe(NO_SKIN);
  });
});

describe('moveLayer (scenarios 6 and 7)', () => {
  const skin = add(add(add(NO_SKIN, 'linear'), 'radial'), 'stripes'); // stripes, radial, linear

  it('swaps a layer with its neighbour', () => {
    expect(presets(moveLayer(skin, 3, 1))).toEqual(['radial', 'stripes', 'linear']);
    expect(presets(moveLayer(skin, 1, -1))).toEqual(['stripes', 'linear', 'radial']);
  });

  it('moves nothing past the ends of the list', () => {
    expect(moveLayer(skin, 3, -1)).toBe(skin);
    expect(moveLayer(skin, 1, 1)).toBe(skin);
  });
});

describe('the other changes', () => {
  const skin = add(add(NO_SKIN, 'linear'), 'dots'); // dots (2), linear (1)

  it('hides a layer and keeps its values and place (scenario 5)', () => {
    const hidden = setVisible(skin, 2, false);
    expect(hidden.layers[0]).toMatchObject({ preset: 'dots', visible: false, params: skin.layers[0].params });
  });

  it('puts one layer on the Cover too (scenario 22)', () => {
    const shared = setOnCover(skin, 1, true);
    expect(shared.layers.map((layer) => layer.onCover)).toEqual([false, true]);
  });

  it('sets the page colors, and keeps the layers', () => {
    const beige = setPageColor(skin, 'pageBackground', '#F5F0E6');
    expect(beige).toMatchObject({ pageBackground: '#F5F0E6', pageText: '#000000' });
    expect(beige.layers).toBe(skin.layers);
  });

  it('removes a layer (scenario 8)', () => {
    expect(presets(removeLayer(skin, 2))).toEqual(['linear']);
  });

  it('changes the values and colors of one layer only (scenario 11)', () => {
    const changed = setLayerColor(setLayerParam(skin, 1, 'intensity', 80), 2, 0, '#1E88E5');
    expect(changed.layers[1].params.intensity).toBe(80);
    expect(changed.layers[0].params.intensity).toBe(30);
    expect(changed.layers[0].colors).toEqual(['#1E88E5', '#0000FF']);
    expect(changed.layers[1].colors).toEqual(AB);
  });

  it('keeps Thickness within Spacing (scenario 15)', () => {
    let stripes = add(NO_SKIN, 'stripes');
    stripes = setLayerParam(stripes, 1, 'thickness', 10);
    stripes = setLayerParam(stripes, 1, 'scale', 6);
    expect(stripes.layers[0].params).toMatchObject({ scale: 6, thickness: 6 });
  });
});

describe('layerNames (scenario 10)', () => {
  it('numbers a preset used again, by when it was added, not by its place', () => {
    const skin = add(add(add(NO_SKIN, 'dots'), 'linear'), 'dots'); // dots (3), linear, dots (1)
    expect([...layerNames(skin.layers).values()]).toEqual(['Dots', 'Linear', 'Dots 2']);
    const moved = moveLayer(skin, 3, 1);
    expect(layerNames(moved.layers).get(3)).toBe('Dots 2');
  });
});
