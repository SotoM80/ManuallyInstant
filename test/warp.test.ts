import {
  areaGrid,
  clampInPhoto,
  gridBounds,
  gridFromRect,
  gridPoint,
  logoMesh,
  logoOutline,
  logoToArea,
  movePoint,
  resampleGrid,
  surfaceSize,
} from '../src/mockups/warp';
import { DEFAULT_PLACEMENT } from '../src/mockups/mockups';
import type { AreaGrid } from '../src/mockups/types';

// Spec: specs/mockups.md, The logo area (an angle, a curve)
const RECT = { x: 100, y: 200, width: 400, height: 200 };

function close(actual: number[], expected: number[], digits = 6) {
  actual.forEach((value, i) => expect(value).toBeCloseTo(expected[i], digits));
}

describe('a straight area', () => {
  const grid = gridFromRect(RECT);

  it('is the four corners of its rectangle, and back', () => {
    expect(grid).toEqual({ cols: 2, rows: 2, points: [[100, 200], [500, 200], [100, 400], [500, 400]] });
    expect(gridBounds(grid)).toEqual(RECT);
    expect(areaGrid({ area: RECT })).toEqual(grid);
  });

  it('maps (u, v) linearly, and measures its own size', () => {
    close(gridPoint(grid, 0.5, 0.5), [300, 300]);
    close(gridPoint(grid, 1, 0), [500, 200]);
    const size = surfaceSize(grid);
    expect(size.width).toBeCloseTo(400);
    expect(size.height).toBeCloseTo(200);
  });

  it('goes on straight past its edges, so a logo larger than the area is not squashed (ADR 0037)', () => {
    close(gridPoint(grid, -0.5, 0.5), [-100, 300]);
    close(gridPoint(grid, 0.5, 1.5), [300, 500]);
    close(gridPoint(grid, 1.25, -0.25), [600, 150]);
  });

  it('puts a centered square logo in the middle, as tall as the area', () => {
    close(logoToArea(grid, 1, DEFAULT_PLACEMENT, 0, 0), [0.25, 0]);
    close(logoToArea(grid, 1, DEFAULT_PLACEMENT, 1, 1), [0.75, 1]);
  });
});

describe('an area at an angle (four corners)', () => {
  // A card seen at an angle: its right side is shorter
  const grid: AreaGrid = { cols: 2, rows: 2, points: [[0, 0], [100, 20], [0, 100], [100, 80]] };

  it('passes through its corners', () => {
    close(gridPoint(grid, 0, 0), [0, 0]);
    close(gridPoint(grid, 1, 0), [100, 20]);
    close(gridPoint(grid, 1, 1), [100, 80]);
    close(gridPoint(grid, 0.5, 0.5), [50, 50]);
  });
});

describe('a curved area (the side of a mug)', () => {
  // Three points across, the middle ones lower: the top and bottom edges bow down
  const grid: AreaGrid = {
    cols: 3,
    rows: 2,
    points: [[0, 0], [50, 10], [100, 0], [0, 60], [50, 70], [100, 60]],
  };

  it('passes through every point, and curves between them', () => {
    close(gridPoint(grid, 0.5, 0), [50, 10]);
    close(gridPoint(grid, 0.5, 1), [50, 70]);
    expect(gridPoint(grid, 0.25, 0)[1]).toBeGreaterThan(0); // bowed, not a straight line to the middle point
  });

  it('is longer along its curve than straight across', () => {
    expect(surfaceSize(grid).width).toBeGreaterThan(100);
  });

  it('draws the logo on a mesh that follows the curve', () => {
    const mesh = logoMesh(grid, 2, DEFAULT_PLACEMENT, 8, 2);
    expect(mesh.count).toBe(8 * 2 * 6);
    expect(mesh.positions).toHaveLength(mesh.count * 2);
    expect(mesh.logoPoints).toHaveLength(mesh.count * 2);
    // Every vertex of the mesh is inside the area's box
    for (let i = 0; i < mesh.positions.length; i += 2) {
      expect(mesh.positions[i]).toBeGreaterThanOrEqual(-1e-6);
      expect(mesh.positions[i]).toBeLessThanOrEqual(100 + 1e-6);
    }
    // And the logo's points run from 0 to 1
    expect(Math.min(...mesh.logoPoints)).toBe(0);
    expect(Math.max(...mesh.logoPoints)).toBe(1);
  });

  it('gives the logo an outline along the curve', () => {
    const outline = logoOutline(grid, 2, DEFAULT_PLACEMENT, 4);
    expect(outline).toHaveLength(16);
  });
});

describe('editing the area', () => {
  const grid = gridFromRect(RECT);

  it('adds points along the current shape, without moving it', () => {
    const more = resampleGrid(grid, 3, 2);
    expect(more.points).toHaveLength(6);
    close(more.points[1], [300, 200]);
    expect(gridBounds(more)).toEqual(RECT);
  });

  it('moves one point', () => {
    const bent = movePoint(resampleGrid(grid, 3, 2), 1, [300, 230]);
    close(gridPoint(bent, 0.5, 0), [300, 230]);
  });

  // A 600 × 600 photo, its area 400 × 200 at (100, 200) (ADR 0037)
  const PHOTO: [number, number] = [600, 600];

  it('lets the logo go past its area, as far as the photo padding allows', () => {
    // A square logo, 200 px: 5 % padding is 30 px, so its center stops at 470, 0.425 of the area across
    expect(clampInPhoto(grid, PHOTO, 1, { x: 0.9, y: 0, scale: 1, rotate: 0 }).x).toBeCloseTo(0.425, 2);
    // No padding: to the photo edge
    expect(clampInPhoto(grid, PHOTO, 1, { x: 0.9, y: 0, scale: 1, rotate: 0, padding: 0 }).x).toBeCloseTo(0.5, 2);
    // Up, past the area's top (200), to 30 px from the photo's top: center at 130
    expect(clampInPhoto(grid, PHOTO, 1, { x: 0, y: -2, scale: 1, rotate: 0 }).y).toBeCloseTo(-0.85, 2);
  });

  it('makes a logo too large for the photo smaller, and keeps it inside (a long logo turned Vertical)', () => {
    // 4:1 at 150 %: 600 long turned, more than the 540 px between the paddings
    const placed = clampInPhoto(grid, PHOTO, 4, { x: 0, y: -1, scale: 1.5, rotate: 0, orientation: 'vertical' });
    expect(placed.scale).toBeCloseTo(1.35, 1);
    const ys = logoOutline(grid, 4, { ...placed, orientation: 'vertical' }).map(([, y]) => y);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(29.5);
    expect(Math.max(...ys)).toBeLessThanOrEqual(570.5);
  });
});
