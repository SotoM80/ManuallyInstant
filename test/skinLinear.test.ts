import { drawLinear } from '../src/skins/draw/linear';
import { drawSkin } from '../src/skins/draw';
import { pageSize } from '../src/skins/draw/types';
import { NO_SKIN, skinFor } from '../src/skins/presets';

const portrait = pageSize('portrait');
const landscape = pageSize('landscape');
const AB = ['#FF0000', '#0000FF'];

function ends(angle: number, page = portrait) {
  const { x1, y1, x2, y2 } = drawLinear({ angle }, AB, page);
  return [x1, y1, x2, y2];
}

function expectClose(actual: number[], expected: number[]) {
  actual.forEach((value, i) => expect(value).toBeCloseTo(expected[i], 2));
}

describe('drawLinear', () => {
  it('runs from the bottom to the top at 0°, as in CSS', () => {
    expectClose(ends(0), [105, 297, 105, 0]);
  });

  it('runs from left to right at 90°', () => {
    expectClose(ends(90), [0, 148.5, 210, 148.5]);
  });

  it('reaches the corners at 45°: A at the bottom-left, B at the top-right (spec scenario 4)', () => {
    expectClose(ends(45), [-21.75, 275.25, 231.75, 21.75]);
  });

  it('runs from the top-left to the bottom-right at 135°', () => {
    expectClose(ends(135), [-21.75, 21.75, 231.75, 275.25]);
  });

  it('uses the landscape page', () => {
    expectClose(ends(135, landscape), [21.75, -21.75, 275.25, 231.75]);
  });

  it('puts the first color at 0 and the second at 1', () => {
    expect(drawLinear({ angle: 135 }, AB, portrait).stops).toEqual([
      { offset: 0, color: '#FF0000' },
      { offset: 1, color: '#0000FF' },
    ]);
  });
});

describe('drawSkin', () => {
  it('draws Linear with its default angle', () => {
    expect(drawSkin(skinFor('linear', [0, 1]), AB, portrait)?.kind).toBe('linear');
  });

  it('draws nothing for None or a preset with no drawing', () => {
    expect(drawSkin(NO_SKIN, AB, portrait)).toBeNull();
    expect(drawSkin({ preset: 'unknown', params: {}, colors: [] }, AB, portrait)).toBeNull();
  });
});
