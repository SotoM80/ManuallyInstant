import { brush, combineMasks, emptyMask, magicWand, maskToPixels, pixelsToMask, selectedShare, softenMask } from '../src/mockups/selection';
import type { Pixels } from '../src/mockups/selection';

// Spec: specs/mockups.md, The template editor (selecting the product)

// A 6 × 4 photo: a white shirt (columns 1–3) on a gray background, with a navy sleeve at column 4
function photo(): Pixels {
  const width = 6;
  const height = 4;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = x >= 1 && x <= 3 ? [250, 250, 248] : x === 4 ? [26, 35, 126] : [128, 128, 128];
      const i = (y * width + x) * 4;
      data.set([r, g, b, 255], i);
    }
  }
  return { data, width, height };
}

const selected = (mask: { data: Uint8ClampedArray; width: number }) =>
  [...mask.data].map((value, i) => (value >= 128 ? `${i % mask.width},${Math.floor(i / mask.width)}` : null)).filter(Boolean);

describe('magicWand', () => {
  it('selects the connected pixels of a similar color', () => {
    const mask = magicWand(photo(), 2, 1, 10);
    expect(selected(mask)).toHaveLength(12); // columns 1–3, 4 rows
    expect(mask.data[0]).toBe(0); // the gray background
    expect(mask.data[4]).toBe(0); // the navy sleeve
  });

  it('takes more with a higher tolerance', () => {
    expect(selected(magicWand(photo(), 2, 1, 60)).length).toBeGreaterThan(12);
  });

  it('selects nothing outside the photo', () => {
    expect(selectedShare(magicWand(photo(), 20, 1, 50))).toBe(0);
  });
});

describe('combineMasks', () => {
  const shirt = magicWand(photo(), 2, 1, 10);
  const sleeve = magicWand(photo(), 4, 1, 10);

  it('adds a selection to another (Shift + click)', () => {
    expect(selected(combineMasks(shirt, sleeve, 'add'))).toHaveLength(16);
  });

  it('takes a selection away (Alt + click)', () => {
    const both = combineMasks(shirt, sleeve, 'add');
    expect(selected(combineMasks(both, sleeve, 'subtract'))).toEqual(selected(shirt));
  });

  it('replaces it with a plain click', () => {
    expect(combineMasks(shirt, sleeve, 'replace')).toBe(sleeve);
  });
});

describe('brush', () => {
  it('paints a round stroke and erases with it', () => {
    const painted = brush(emptyMask(20, 20), [5, 10], [15, 10], 2, false);
    expect(painted.data[10 * 20 + 10]).toBe(255);
    expect(painted.data[0]).toBe(0);
    const erased = brush(painted, [10, 10], [10, 10], 3, true);
    expect(erased.data[10 * 20 + 10]).toBe(0);
    expect(erased.data[10 * 20 + 5]).toBe(255);
  });
});

describe('softenMask', () => {
  it('softens a hard edge into a ramp, and leaves the inside and outside full', () => {
    const half = emptyMask(10, 1);
    half.data.fill(255, 5);
    const soft = softenMask(half, 2).data;
    expect(soft[0]).toBe(0);
    expect(soft[9]).toBe(255);
    expect(soft[4]).toBeGreaterThan(0);
    expect(soft[4]).toBeLessThan(255);
  });
});

describe('mask and pixels', () => {
  it('turns a mask into white pixels with its alpha, and back', () => {
    const mask = magicWand(photo(), 2, 1, 10);
    const pixels = { data: maskToPixels(mask), width: mask.width, height: mask.height };
    expect([...pixels.data.slice(4, 8)]).toEqual([255, 255, 255, 255]);
    expect(pixels.data[3]).toBe(0);
    expect(pixelsToMask(pixels).data).toEqual(mask.data);
  });

  it('reads an opaque black and white mask by its brightness', () => {
    const data = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255]);
    expect([...pixelsToMask({ data, width: 2, height: 1 }).data]).toEqual([255, 0]);
  });
});
