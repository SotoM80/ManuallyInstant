import { logoBox } from '../../utils/logoBox'
import { stepLabel } from '../../utils/rulers'
import { useVisibleBounds } from '../../utils/visibleBounds'

type ConstructionGridProps = {
  logo: { url: string } // the Primary version, or the Cover's logo
  modules: number // how many squares fit across the logo
  x: number // how many modules X measures (also the margin around the logo)
  rulerTop?: number[] // steps of the dimension line above the grid, in X (e.g. [1, 1.5, 1])
  rulerSide?: number[] // steps of the dimension line beside the grid
}

// Room for the rulers outside the grid, in modules (the side one needs room for "1.5X")
const TOP_ROOM = 1.6
const SIDE_ROOM = 2.6

// Where each step of a ruler starts and ends, from `start`, with each step `value × x` long
function rulerCuts(steps: number[], x: number, start: number) {
  let at = start
  return [start, ...steps.map((value) => (at += value * x))]
}

// Positions of the grid lines between 0 and `size`, one module apart, lined up with the
// logo's box (which starts at `offset`), so a margin of 1.5 modules still meets a line
function gridLines(size: number, offset: number) {
  const first = offset - Math.floor(offset)
  return Array.from({ length: Math.floor(size - first) + 1 }, (_, i) => first + i)
}

// 3.2 Construction grid, drawn by the app when none is uploaded: square modules fitted to
// the visible part of the logo (its transparent margins are ignored), X of margin around
// it, the logo's box in a dashed line, and X marked at the top. X is the same measure as the
// clear space of 3.1. Everything is measured in modules, so the SVG scales to any page size.
export function ConstructionGrid({ logo, modules, x, rulerTop = [], rulerSide = [] }: ConstructionGridProps) {
  const bounds = useVisibleBounds(logo.url)
  const margin = x // X of free room on every side

  // The visible logo is `modules` wide; its height follows its own proportions, and it is
  // centred in whole rows of modules
  const logoHeight = logoBox(bounds, modules, margin).height
  const rows = Math.max(1, Math.ceil(logoHeight - 0.001))
  const width = modules + margin * 2
  const height = rows + margin * 2
  const logoTop = margin + (rows - logoHeight) / 2
  const { image } = logoBox(bounds, modules, margin, logoTop)

  // Rulers: they start at the logo's edges and are measured in X, so they follow X.
  // A ruler longer than the grid makes the drawing grow to show it whole.
  const topCuts = rulerCuts(rulerTop, x, margin)
  const sideCuts = rulerCuts(rulerSide, x, logoTop)
  const top = rulerTop.length > 0 ? TOP_ROOM : 0
  const gridRight = Math.max(width, topCuts[topCuts.length - 1])
  const totalWidth = gridRight + (rulerSide.length > 0 ? SIDE_ROOM : 0)
  const totalHeight = top + Math.max(height, sideCuts[sideCuts.length - 1])
  const sideX = gridRight + 0.7 // where the side ruler runs

  const lines = [
    ...gridLines(width, margin).map((i) => `M${i} 0V${height}`),
    ...gridLines(height, margin).map((j) => `M0 ${j}H${width}`),
    `M0 0H${width}V${height}H0Z`, // the outer edge, even when it falls between lines
  ].join('')

  return (
    <svg
      className="construction-grid"
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      role="img"
      aria-label="Generated construction grid"
      data-modules={modules}
      data-x={x}
    >
      {/* The grid, moved down to leave room for the top ruler */}
      <g transform={`translate(0 ${top})`}>
        <image href={logo.url} {...image} preserveAspectRatio="none" />
        <path className="construction-grid-lines" d={lines} />
        <rect
          className="construction-grid-logo"
          x={margin}
          y={logoTop}
          width={modules}
          height={logoHeight}
        />
        {/* X, with a small dimension line in the top margin (the top ruler shows it instead) */}
        {rulerTop.length === 0 && (
          <g className="construction-grid-x" aria-hidden="true">
            <path
              d={`M${margin} ${margin / 2 - 0.2}V${margin / 2 + 0.2}M${margin} ${margin / 2}H${margin * 2}M${margin * 2} ${margin / 2 - 0.2}V${margin / 2 + 0.2}`}
            />
            <text x={margin * 1.5} y={margin / 2 - 0.12} textAnchor="middle">
              X
            </text>
          </g>
        )}

        {/* Guides: where each step of a ruler meets the grid */}
        <path
          className="construction-grid-guides"
          d={[
            ...(rulerTop.length > 0 ? topCuts.map((cx) => `M${cx} 0V${height}`) : []),
            ...(rulerSide.length > 0 ? sideCuts.map((cy) => `M0 ${cy}H${width}`) : []),
          ].join('')}
        />

        {rulerSide.length > 0 && (
          <g
            className="construction-grid-ruler"
            data-ruler="side"
            data-length={sideCuts[sideCuts.length - 1] - sideCuts[0]}
          >
            <path
              d={[
                `M${sideX} ${sideCuts[0]}V${sideCuts[sideCuts.length - 1]}`,
                ...sideCuts.map((cy) => `M${sideX - 0.2} ${cy}H${sideX + 0.2}`),
              ].join('')}
            />
            {rulerSide.map((value, i) => (
              <text key={i} x={sideX + 0.35} y={(sideCuts[i] + sideCuts[i + 1]) / 2} dominantBaseline="central">
                {stepLabel(value)}
              </text>
            ))}
          </g>
        )}
      </g>

      {rulerTop.length > 0 && (
        <g
          className="construction-grid-ruler"
          data-ruler="top"
          data-length={topCuts[topCuts.length - 1] - topCuts[0]}
        >
          <path
            d={[
              `M${topCuts[0]} ${TOP_ROOM * 0.7}H${topCuts[topCuts.length - 1]}`,
              ...topCuts.map((cx) => `M${cx} ${TOP_ROOM * 0.5}V${TOP_ROOM * 0.9}`),
            ].join('')}
          />
          {rulerTop.map((value, i) => (
            <text key={i} x={(topCuts[i] + topCuts[i + 1]) / 2} y={TOP_ROOM * 0.45} textAnchor="middle">
              {stepLabel(value)}
            </text>
          ))}
        </g>
      )}
    </svg>
  )
}
