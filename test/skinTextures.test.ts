import { GRAIN_SEED, drawGrain } from '../src/skins/draw/grain';
import { PAPER_SEED, drawPaper } from '../src/skins/draw/paper';
import { pageSize } from '../src/skins/draw/types';

// Spec: specs/skins.md, Section 2 — The presets (Textures)
const page = pageSize('portrait');
const AB = ['#FF0000', '#0000FF'];

describe('drawGrain', () => {
  it('draws specks of Color A and Color B from two channels of a fixed noise, with no base (scenario 24)', () => {
    expect(drawGrain({ size: 1 }, AB, page)).toEqual({
      kind: 'texture',
      frequency: [1.2, 1.2],
      octaves: 2,
      seed: GRAIN_SEED,
      tints: [
        { color: '#FF0000', channel: 'r', gain: 6, cut: 3.6 },
        { color: '#0000FF', channel: 'g', gain: 6, cut: 3.6 },
      ],
    });
  });

  it('gives bigger, rarer specks with a bigger Grain size (scenario 25)', () => {
    const fine = drawGrain({ size: 1 }, AB, page);
    const coarse = drawGrain({ size: 4 }, AB, page);
    if (fine.kind !== 'texture' || coarse.kind !== 'texture') throw new Error('not a texture');
    expect(coarse.frequency[0]).toBeCloseTo(fine.frequency[0] / 4);
  });
});

describe('drawPaper', () => {
  it('covers the page with Color B and long fibers of Color A (scenario 26)', () => {
    const paper = drawPaper({ size: 2 }, AB, page);
    if (paper.kind !== 'texture') throw new Error('not a texture');
    expect(paper).toMatchObject({ base: '#0000FF', seed: PAPER_SEED, octaves: 3 });
    expect(paper.tints).toEqual([{ color: '#FF0000', channel: 'r', gain: 3, cut: 1.5 }]);
    // Slower across than down: the fibers are long and run across the page
    const [across, down] = paper.frequency;
    expect(down / across).toBeCloseTo(8);
  });

  it('gives longer fibers with a bigger Fiber size', () => {
    const short = drawPaper({ size: 1 }, AB, page);
    const long = drawPaper({ size: 6 }, AB, page);
    if (short.kind !== 'texture' || long.kind !== 'texture') throw new Error('not a texture');
    expect(long.frequency[0]).toBeLessThan(short.frequency[0]);
  });
});
