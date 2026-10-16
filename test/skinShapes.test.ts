import { CIRCLE_SHRINK, drawCircles } from '../src/skins/draw/circles';
import { belowEdge, drawDiagonal, polygonArea } from '../src/skins/draw/diagonal';
import { WAVE_GAP, drawWaves } from '../src/skins/draw/waves';
import { pageSize } from '../src/skins/draw/types';
import type { Mark, SkinShape } from '../src/skins/draw/types';

// Spec: specs/skins.md, Section 2 — The presets (Shapes)
const portrait = pageSize('portrait');
const landscape = pageSize('landscape');
const AB = ['#FF0000', '#0000FF'];

function shapeMarks(shape: SkinShape): Mark[] {
  if (shape.kind !== 'shapes') throw new Error(`not shapes: ${shape.kind}`);
  return shape.marks;
}

describe('drawCircles', () => {
  it('puts the first circle at the center, Size % of the shorter side wide', () => {
    const [first] = shapeMarks(drawCircles({ count: 1, size: 50, angle: 0 }, AB, portrait));
    expect(first).toEqual({ type: 'circle', cx: 105, cy: 148.5, r: 52.5, color: '#FF0000' });
  });

  it('lines up smaller circles that touch, towards the Direction, alternating the colors', () => {
    const circles = shapeMarks(drawCircles({ count: 3, size: 50, angle: 90 }, AB, portrait));
    expect(circles.map((mark) => mark.type === 'circle' && mark.color)).toEqual(['#FF0000', '#0000FF', '#FF0000']);
    const [first, second] = circles as Extract<Mark, { type: 'circle' }>[];
    expect(second.r).toBeCloseTo(first.r * CIRCLE_SHRINK);
    expect(second.cx).toBeCloseTo(first.cx + first.r + second.r); // 90° points right
    expect(second.cy).toBeCloseTo(first.cy);
  });

  it('goes up the page at 0°, as the angles of CSS', () => {
    const [first, second] = shapeMarks(drawCircles({ count: 2, size: 40, angle: 0 }, AB, portrait)) as Extract<
      Mark,
      { type: 'circle' }
    >[];
    expect(second.cy).toBeLessThan(first.cy);
  });
});

describe('drawDiagonal', () => {
  it.each([
    [0, 35, portrait],
    [20, 35, portrait],
    [-45, 70, portrait],
    [60, 10, portrait],
    [60, 90, landscape],
  ])('covers the Coverage with Color A at %d° and %d %%', (angle, coverage, page) => {
    const [background, block] = shapeMarks(drawDiagonal({ angle, coverage }, AB, page));
    expect(background).toMatchObject({ type: 'rect', width: page.width, height: page.height, color: '#0000FF' });
    expect(block).toMatchObject({ type: 'path', color: '#FF0000' });
    const points = (block as Extract<Mark, { type: 'path' }>).d
      .replace(/[MZ]/g, '')
      .split('L')
      .map((pair) => pair.trim().split(' ').map(Number) as [number, number]);
    expect(polygonArea(points) / (page.width * page.height)).toBeCloseTo(coverage / 100, 2);
  });

  it('puts Color A below a flat edge at 0°', () => {
    const block = belowEdge(portrait, 0, 200);
    expect(block).toHaveLength(4);
    expect(block).toEqual(expect.arrayContaining([[0, 200], [210, 200], [210, 297], [0, 297]]));
  });

  it('rises to the right with a positive angle', () => {
    const block = belowEdge(portrait, 45, 148.5);
    const [right] = block.filter(([x]) => x === 210);
    const [left] = block.filter(([x, y]) => x === 0 && y < 297);
    expect(right[1]).toBeLessThan(left[1]);
  });
});

describe('drawWaves', () => {
  it('fills the page with bands of Color A over Color B, 2 × Amplitude + 10 mm high', () => {
    const shape = drawWaves({ amplitude: 12, frequency: 2, angle: 30 }, AB, portrait);
    const [background, ...bands] = shapeMarks(shape);
    expect(shape).toMatchObject({ kind: 'shapes', angle: 30 });
    expect(background).toMatchObject({ type: 'rect', color: '#0000FF' });
    // Over a square as wide as the diagonal, a band of A every two bands
    const diagonal = Math.hypot(210, 297);
    const band = 12 * 2 + WAVE_GAP;
    expect(bands.length).toBeGreaterThanOrEqual(Math.floor(diagonal / (band * 2)));
    expect(bands.every((mark) => mark.type === 'path' && mark.color === '#FF0000')).toBe(true);
    const rect = background as Extract<Mark, { type: 'rect' }>;
    expect(rect.width).toBeCloseTo(diagonal);
  });

  it('fits Frequency whole waves across the page', () => {
    const [, band] = shapeMarks(drawWaves({ amplitude: 10, frequency: 3, angle: 0 }, AB, portrait));
    const d = (band as Extract<Mark, { type: 'path' }>).d;
    const top = d.split(' L ').slice(0, 5).map((pair) => pair.replace('M ', '').split(' ').map(Number));
    // y = base + amplitude · sin(2πx / (210 / 3)): the first points rise and fall with the wave
    const [x0, y0] = top[0];
    const base = y0 - 10 * Math.sin((2 * Math.PI * x0) / 70);
    for (const [x, y] of top) expect(y).toBeCloseTo(base + 10 * Math.sin((2 * Math.PI * x) / 70), 1);
  });
});
