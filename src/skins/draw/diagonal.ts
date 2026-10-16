import type { DrawSkin, Page } from './types'

type Point = [number, number]

// The part of the page below the line y = top − tan(lean)·(x − w/2) (in SVG, y grows downwards),
// as a polygon: the page's corners clipped by that line (Sutherland–Hodgman, one edge)
export function belowEdge(page: Page, lean: number, top: number): Point[] {
  const slope = Math.tan((lean * Math.PI) / 180)
  const lineY = (x: number) => top - slope * (x - page.width / 2)
  const inside = ([x, y]: Point) => y >= lineY(x)
  const corners: Point[] = [
    [0, 0],
    [page.width, 0],
    [page.width, page.height],
    [0, page.height],
  ]
  const result: Point[] = []
  corners.forEach((current, i) => {
    const previous = corners[(i + corners.length - 1) % corners.length]
    if (inside(current) !== inside(previous)) {
      // Where the side of the page crosses the line
      const [x1, y1] = previous
      const [x2, y2] = current
      const t = (y1 - lineY(x1)) / (y1 - lineY(x1) - (y2 - lineY(x2)))
      result.push([x1 + t * (x2 - x1), y1 + t * (y2 - y1)])
    }
    if (inside(current)) result.push(current)
  })
  return result
}

export function polygonArea(points: Point[]) {
  let sum = 0
  points.forEach(([x1, y1], i) => {
    const [x2, y2] = points[(i + 1) % points.length]
    sum += x1 * y2 - x2 * y1
  })
  return Math.abs(sum) / 2
}

// The page split in two by a straight edge: Color A below it, covering `coverage` % of the page,
// and Color B above. `angle` is how much the edge leans from horizontal (positive rises to the right).
export const drawDiagonal: DrawSkin = (params, [a, b], page) => {
  const lean = params.angle ?? 0
  const target = ((params.coverage ?? 50) / 100) * page.width * page.height
  // Where the edge crosses the middle of the page, found by halving: lower edge → less of A
  const reach = (page.width / 2) * Math.abs(Math.tan((lean * Math.PI) / 180))
  let low = -reach
  let high = page.height + reach
  for (let i = 0; i < 50; i++) {
    const middle = (low + high) / 2
    if (polygonArea(belowEdge(page, lean, middle)) > target) low = middle
    else high = middle
  }
  const block = belowEdge(page, lean, (low + high) / 2)
  const d = `M ${block.map(([x, y]) => `${round(x)} ${round(y)}`).join(' L ')} Z`
  return {
    kind: 'shapes',
    angle: 0,
    marks: [
      { type: 'rect', x: 0, y: 0, width: page.width, height: page.height, color: b },
      { type: 'path', d, color: a },
    ],
  }
}

const round = (value: number) => Math.round(value * 100) / 100
