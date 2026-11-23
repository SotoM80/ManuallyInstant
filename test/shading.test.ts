import { meanBrightness, meshBox } from '../src/mockups/render/shading';

// Spec: specs/mockups.md, How a photo mockup is drawn (Solid). The mean brightness under the
// logo, so a Solid logo is shaded only by what is darker than the product around it.

// RGBA pixels, one [r, g, b, a] per pixel
const pixels = (...list: number[][]) => ({ data: new Uint8ClampedArray(list.flat()) });

describe('meanBrightness', () => {
  it('is the brightness of a flat color', () => {
    expect(meanBrightness(pixels([255, 255, 255, 255], [255, 255, 255, 255]), null, 0.92)).toBeCloseTo(1);
    expect(meanBrightness(pixels([51, 51, 51, 255]), null, 0.92)).toBeCloseTo(0.2);
  });

  it('leaves out the transparent parts of a photo', () => {
    expect(meanBrightness(pixels([51, 51, 51, 255], [255, 255, 255, 0]), null, 0.92)).toBeCloseTo(0.2);
  });

  it('counts only the product when the mask covers any of the pixels', () => {
    const photo = pixels([51, 51, 51, 255], [255, 255, 255, 255]);
    const mask = pixels([255, 255, 255, 255], [0, 0, 0, 0]);
    expect(meanBrightness(photo, mask, 0.92)).toBeCloseTo(0.2);
  });

  it('counts every pixel when the mask covers none of them', () => {
    const photo = pixels([0, 0, 0, 255], [255, 255, 255, 255]);
    expect(meanBrightness(photo, pixels([0, 0, 0, 0], [0, 0, 0, 0]), 0.92)).toBeCloseTo(0.5);
  });

  it('never goes below a floor, so the noise of a black photo is not deep folds', () => {
    expect(meanBrightness(pixels([0, 0, 0, 255]), null, 0.92)).toBe(0.04);
  });

  it('falls back when nothing can be weighed', () => {
    expect(meanBrightness(pixels([0, 0, 0, 0]), null, 0.92)).toBe(0.92);
  });
});

describe('meshBox', () => {
  it('holds every point, scaled to the image and kept inside it', () => {
    const positions = new Float32Array([10, 20, 50, 20, 10, 60, -5, 70]);
    expect(meshBox(positions, 2, 100, 100)).toEqual({ x: 0, y: 40, width: 100, height: 60 });
  });
});
