import { drawRadial } from '../src/skins/draw/radial';
import { drawDots } from '../src/skins/draw/dots';
import { drawStripes } from '../src/skins/draw/stripes';
import { pageSize } from '../src/skins/draw/types';
import { SKIN_PRESETS, controlMax, withParam } from '../src/skins/presets';

// Spec: specs/skins.md, Section 2 — The presets
const portrait = pageSize('portrait');
const AB = ['#FF0000', '#0000FF'];

describe('drawRadial', () => {
  it('puts Color A at the center and reaches Color B at a share of the diagonal', () => {
    const shape = drawRadial({ cx: 50, cy: 0, radius: 100 }, AB, portrait);
    expect(shape).toMatchObject({ kind: 'radial', cx: 105, cy: 0 });
    expect(shape).toHaveProperty('r', Math.hypot(210, 297));
    expect(shape).toHaveProperty('stops', [
      { offset: 0, color: '#FF0000' },
      { offset: 1, color: '#0000FF' },
    ]);
  });
});

describe('drawDots', () => {
  it('draws dots a third of the scale wide, alternating the colors by row', () => {
    expect(drawDots({ scale: 12, angle: 30 }, AB, portrait)).toEqual({
      kind: 'pattern',
      width: 12,
      height: 24,
      angle: 30,
      marks: [
        { type: 'circle', cx: 6, cy: 6, r: 2, color: '#FF0000' },
        { type: 'circle', cx: 6, cy: 18, r: 2, color: '#0000FF' },
      ],
    });
  });
});

describe('drawStripes', () => {
  it('draws stripes of Color A and Color B, one every Spacing mm', () => {
    const shape = drawStripes({ scale: 10, thickness: 3, angle: 45 }, AB, portrait);
    expect(shape).toMatchObject({ kind: 'pattern', width: 20, height: 20, angle: 45 });
    expect(shape).toHaveProperty('marks', [
      { type: 'rect', x: 0, y: 0, width: 3, height: 20, color: '#FF0000' },
      { type: 'rect', x: 10, y: 0, width: 3, height: 20, color: '#0000FF' },
    ]);
  });

  it('never draws a stripe wider than Spacing', () => {
    const shape = drawStripes({ scale: 6, thickness: 10, angle: 0 }, AB, portrait);
    expect(shape).toHaveProperty(['marks', 0, 'width'], 6);
  });
});

describe('Thickness never passes Spacing (scenario 11)', () => {
  const thickness = SKIN_PRESETS.find((preset) => preset.id === 'stripes')!.controls.find(
    (control) => control.key === 'thickness',
  )!;

  it('limits the Thickness slider to the current Spacing', () => {
    expect(controlMax(thickness, { scale: 6, thickness: 4 })).toBe(6);
    expect(controlMax(thickness, { scale: 40, thickness: 4 })).toBe(20);
  });

  it('lowers Thickness with Spacing', () => {
    expect(withParam({ scale: 12, thickness: 10 }, 'scale', 6)).toEqual({ scale: 6, thickness: 6 });
    expect(withParam({ scale: 12, thickness: 4 }, 'scale', 6)).toEqual({ scale: 6, thickness: 4 });
  });
});
