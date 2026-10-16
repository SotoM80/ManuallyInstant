import {
  MAX_LAYERS,
  addLayer,
  layerNames,
  moveLayer,
  removeLayer,
  setLayerColor,
  setLayerParam,
  setVisible,
} from '../src/skins/layers';
import { NO_SKIN } from '../src/skins/presets';
import type { Skin } from '../src/skins/types';

// Spec: specs/skins.md — the list of layers (ADR 0010)
function presets(skin: Skin) {
  return skin.layers.map((layer) => layer.preset);
}

describe('addLayer', () => {
  it('adds a layer with the default values, Auto colors and on (scenario 3)', () => {
    const [layer] = addLayer(NO_SKIN, 'linear').layers;
    expect(layer).toEqual({
      id: 1,
      preset: 'linear',
      params: { angle: 135, intensity: 30 },
      colors: [null, null],
      visible: true,
    });
  });

  it('puts a new layer on top (scenario 4)', () => {
    expect(presets(addLayer(addLayer(NO_SKIN, 'linear'), 'dots'))).toEqual(['dots', 'linear']);
  });

  it(`adds no more than ${MAX_LAYERS} layers (scenario 9)`, () => {
    let skin = NO_SKIN;
    for (const id of ['linear', 'radial', 'dots', 'stripes', 'dots']) skin = addLayer(skin, id);
    expect(skin.layers).toHaveLength(MAX_LAYERS);
  });

  it('never gives a removed id to a new layer', () => {
    const skin = addLayer(addLayer(NO_SKIN, 'linear'), 'dots'); // ids 1, 2
    const again = addLayer(removeLayer(skin, 2), 'stripes');
    expect(again.layers.map((layer) => layer.id)).toEqual([3, 1]);
  });

  it('ignores a preset that does not exist', () => {
    expect(addLayer(NO_SKIN, 'unknown')).toBe(NO_SKIN);
  });
});

describe('moveLayer (scenarios 6 and 7)', () => {
  const skin = addLayer(addLayer(addLayer(NO_SKIN, 'linear'), 'radial'), 'stripes'); // stripes, radial, linear

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
  const skin = addLayer(addLayer(NO_SKIN, 'linear'), 'dots'); // dots (2), linear (1)

  it('hides a layer and keeps its values and place (scenario 5)', () => {
    const hidden = setVisible(skin, 2, false);
    expect(hidden.layers[0]).toMatchObject({ preset: 'dots', visible: false, params: skin.layers[0].params });
  });

  it('removes a layer (scenario 8)', () => {
    expect(presets(removeLayer(skin, 2))).toEqual(['linear']);
  });

  it('changes the values and colors of one layer only (scenario 11)', () => {
    const changed = setLayerColor(setLayerParam(skin, 1, 'intensity', 80), 2, 0, 7);
    expect(changed.layers[1].params.intensity).toBe(80);
    expect(changed.layers[0].params.intensity).toBe(30);
    expect(changed.layers[0].colors).toEqual([7, null]);
    expect(changed.layers[1].colors).toEqual([null, null]);
  });

  it('keeps Thickness within Spacing (scenario 15)', () => {
    let stripes = addLayer(NO_SKIN, 'stripes');
    stripes = setLayerParam(stripes, 1, 'thickness', 10);
    stripes = setLayerParam(stripes, 1, 'scale', 6);
    expect(stripes.layers[0].params).toMatchObject({ scale: 6, thickness: 6 });
  });
});

describe('layerNames (scenario 10)', () => {
  it('numbers a preset used again, by when it was added, not by its place', () => {
    const skin = addLayer(addLayer(addLayer(NO_SKIN, 'dots'), 'linear'), 'dots'); // dots (3), linear, dots (1)
    expect([...layerNames(skin.layers).values()]).toEqual(['Dots', 'Linear', 'Dots 2']);
    const moved = moveLayer(skin, 3, 1);
    expect(layerNames(moved.layers).get(3)).toBe('Dots 2');
  });
});
