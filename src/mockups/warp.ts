import { clampPlacement, fitLogo } from './geometry'
import type { AreaGrid, Placement, PhotoTemplate } from './types'

// Where the logo goes on a photo, as a grid of points the user drags in the template editor (see
// specs/mockups.md, The logo area): 2 × 2 points are four corners (an area at an angle), more
// points across follow a curve (the side of a mug). The logo is drawn on a mesh of small
// triangles bent through these points. Pure functions, in the photo's pixels.

type Point = [number, number]

// A plain rectangle, as the four corners of a 2 × 2 grid
export function gridFromRect(area: PhotoTemplate['area']): AreaGrid {
  const { x, y, width, height } = area
  return { cols: 2, rows: 2, points: [[x, y], [x + width, y], [x, y + height], [x + width, y + height]] }
}

// A template's grid: its own, or its rectangle's corners
export function areaGrid(template: Pick<PhotoTemplate, 'area' | 'grid'>): AreaGrid {
  return template.grid ?? gridFromRect(template.area)
}

// The box around a grid, kept as the template's `area` (older code and the editor's first drag)
export function gridBounds(grid: AreaGrid): PhotoTemplate['area'] {
  const xs = grid.points.map(([x]) => x)
  const ys = grid.points.map(([, y]) => y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y }
}

// A smooth curve through points (Catmull-Rom; straight with two), at t from 0 to 1
function curve(points: Point[], t: number): Point {
  if (points.length === 1 || t <= 0) return points[0]
  if (t >= 1) return points[points.length - 1] // exactly, so the ends are where the user put them
  const segments = points.length - 1
  const at = Math.min(segments - 1e-9, Math.max(0, t * segments))
  const i = Math.floor(at)
  const local = at - i
  if (points.length === 2) {
    const [a, b] = points
    return [a[0] + (b[0] - a[0]) * local, a[1] + (b[1] - a[1]) * local]
  }
  const p0 = points[Math.max(0, i - 1)]
  const p1 = points[i]
  const p2 = points[i + 1]
  const p3 = points[Math.min(points.length - 1, i + 2)]
  const s = local
  const s2 = s * s
  const s3 = s2 * s
  const blend = (k: 0 | 1) =>
    0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * s + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * s2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * s3)
  return [blend(0), blend(1)]
}

function row(grid: AreaGrid, r: number): Point[] {
  return grid.points.slice(r * grid.cols, (r + 1) * grid.cols)
}

// The point of the area at (u, v): u from 0 (left) to 1 (right) along each row's curve, then v
// from 0 (top) to 1 (bottom) through the rows
export function gridPoint(grid: AreaGrid, u: number, v: number): Point {
  const across = Array.from({ length: grid.rows }, (_, r) => curve(row(grid, r), u))
  return curve(across, v)
}

// The length of a curve of the area, measured with small steps
function length(at: (t: number) => Point, steps = 24) {
  let total = 0
  let last = at(0)
  for (let i = 1; i <= steps; i++) {
    const next = at(i / steps)
    total += Math.hypot(next[0] - last[0], next[1] - last[1])
    last = next
  }
  return total
}

// How wide and tall the area is along its surface (the mean of its opposite edges): a logo
// keeps its proportions on that size, however bent the area is
export function surfaceSize(grid: AreaGrid) {
  const width = (length((t) => gridPoint(grid, t, 0)) + length((t) => gridPoint(grid, t, 1))) / 2
  const height = (length((t) => gridPoint(grid, 0, t)) + length((t) => gridPoint(grid, 1, t))) / 2
  return { width: width || 1, height: height || 1 }
}

// Where a point of the logo (s, t from 0 to 1 across and down it) falls in the area (u, v),
// with the logo fitted, moved, resized and turned as `placement` says
export function logoToArea(grid: AreaGrid, aspect: number, placement: Placement, s: number, t: number): Point {
  const surface = surfaceSize(grid)
  const { width, height } = fitLogo({ x: 0, y: 0, ...surface }, aspect, placement.scale)
  const turn = (placement.rotate * Math.PI) / 180
  const dx = (s - 0.5) * width
  const dy = (t - 0.5) * height
  return [
    0.5 + placement.x + (dx * Math.cos(turn) - dy * Math.sin(turn)) / surface.width,
    0.5 + placement.y + (dx * Math.sin(turn) + dy * Math.cos(turn)) / surface.height,
  ]
}

// The placement kept inside the area, on its surface size
export function clampOnGrid(grid: AreaGrid, aspect: number, placement: Placement) {
  return clampPlacement({ x: 0, y: 0, ...surfaceSize(grid) }, aspect, placement)
}

// The mesh the logo is drawn on: `across` × `down` small quads, two triangles each, with where
// each corner falls on the photo (in its pixels) and which point of the logo it shows
export function logoMesh(grid: AreaGrid, aspect: number, placement: Placement, across = 32, down = 16) {
  const positions: number[] = []
  const logoPoints: number[] = []
  const vertex = (i: number, j: number) => {
    const s = i / across
    const t = j / down
    const [u, v] = logoToArea(grid, aspect, placement, s, t)
    return { at: gridPoint(grid, u, v), s, t }
  }
  for (let j = 0; j < down; j++) {
    for (let i = 0; i < across; i++) {
      const a = vertex(i, j)
      const b = vertex(i + 1, j)
      const c = vertex(i, j + 1)
      const d = vertex(i + 1, j + 1)
      for (const corner of [a, b, c, b, d, c]) {
        positions.push(corner.at[0], corner.at[1])
        logoPoints.push(corner.s, corner.t)
      }
    }
  }
  return { positions: new Float32Array(positions), logoPoints: new Float32Array(logoPoints), count: positions.length / 2 }
}

// The outline of the logo on the photo, to show where it is and to drag it
export function logoOutline(grid: AreaGrid, aspect: number, placement: Placement, steps = 12): Point[] {
  const side = (from: Point, to: Point) =>
    Array.from({ length: steps }, (_, k) => {
      const f = k / steps
      const [u, v] = logoToArea(grid, aspect, placement, from[0] + (to[0] - from[0]) * f, from[1] + (to[1] - from[1]) * f)
      return gridPoint(grid, u, v)
    })
  return [...side([0, 0], [1, 0]), ...side([1, 0], [1, 1]), ...side([1, 1], [0, 1]), ...side([0, 1], [0, 0])]
}

// The same area with another number of points, laid along its current shape (so changing the
// number of points never moves the area)
export function resampleGrid(grid: AreaGrid, cols: number, rows: number): AreaGrid {
  const points: Point[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) points.push(gridPoint(grid, c / (cols - 1), r / (rows - 1)))
  }
  return { cols, rows, points }
}

// The grid with one point moved
export function movePoint(grid: AreaGrid, index: number, to: Point): AreaGrid {
  return { ...grid, points: grid.points.map((point, i) => (i === index ? to : point)) }
}
