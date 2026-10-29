import { addLayer, setLayerFit, setLayerImage } from '../src/skins/layers';
import { drawLayer } from '../src/skins/draw';
import { isImageLayer } from '../src/skins/draw/image';
import { NO_SKIN, SKIN_TYPES, findPreset } from '../src/skins/presets';

// Spec: specs/skins.md, "Image layers" (ADR 0023)
const AB: [string, string] = ['#000000', '#FFFFFF'];
const PAGE = { width: 210, height: 297 };

describe('Skin – Image layer data', () => {
  it('is a preset of its own group, with only Intensity', () => {
    expect(SKIN_TYPES.at(-1)).toEqual({ type: 'image', label: 'Images' });
    expect(findPreset('image')?.controls.map((control) => control.key)).toEqual(['intensity']);
  });

  it('starts with no picture, filling the page, at 30 %', () => {
    const [layer] = addLayer(NO_SKIN, 'image', AB).layers;
    expect(layer).toMatchObject({ preset: 'image', image: null, fit: 'cover', params: { intensity: 30 } });
    expect(isImageLayer(layer)).toBe(true);
    expect(addLayer(NO_SKIN, 'dots', AB).layers[0]).not.toHaveProperty('image');
  });

  it('sets its picture and its Fit, leaving the other layers alone', () => {
    let skin = addLayer(addLayer(NO_SKIN, 'dots', AB), 'image', AB);
    const id = skin.layers[0].id;
    skin = setLayerFit(setLayerImage(skin, id, { url: 'blob:paper.jpg', name: 'paper.jpg' }), id, 'contain');
    expect(skin.layers[0]).toMatchObject({ image: { url: 'blob:paper.jpg' }, fit: 'contain' });
    expect(skin.layers[1]).not.toHaveProperty('image');
  });

  it('draws nothing until it has a picture, then the picture with its Fit', () => {
    const [layer] = addLayer(NO_SKIN, 'image', AB).layers;
    expect(drawLayer(layer, AB, PAGE)).toBeNull();
    expect(drawLayer({ ...layer, image: { url: 'blob:paper.jpg', name: 'paper.jpg' } }, AB, PAGE)).toEqual({
      kind: 'image',
      url: 'blob:paper.jpg',
      fit: 'cover',
    });
  });
});
