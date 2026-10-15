import type { MouseEvent } from 'react'
import { logoBox } from '../../utils/logoBox'
import { stepLabel } from '../../utils/rulers'
import { gapLabel, guideCuts, snapGuide, toggleGuide } from '../../utils/guides'
import type { Guides } from '../../utils/guides'
import { useVisibleBounds } from '../../utils/visibleBounds'

type ConstructionGridProps = {
  logo: { url: string } // the Primary version, or the Cover's logo
  modules: number // how many squares fit across the logo
  x: number // how many modules X measures (also the margin around the logo)
  rulerTop?: number[] // steps of the dimension line above the grid, in X (e.g. [1, 1.5, 1])
  rulerSide?: number[] // steps of the dimension line beside the grid
  guides?: Guides // guides placed with a click; on an axis with guides, they replace the typed ruler
  onGuidesChange?: (guides: Guides) => void // given → the rulers can be clicked to add guides
}

// Room for the rulers outside the grid, in modules (the side one needs room for "1.5X")
const TOP_ROOM = 1.6
const SIDE_ROOM = 2.6
// Room for the logo's overall size: its width below the grid, its height on the left
const BOTTOM_ROOM = 1.4
const LEFT_ROOM = 2.6

// A ruler: where each step starts and ends, and the label of each step
type Ruler = { cuts: number[]; labels: string[] }

// A typed ruler: each step is `value × x` long, from `start`
function typedRuler(steps: number[], x: number, start: number): Ruler {
  let at = start
  return { cuts: [start, ...steps.map((value) => (at += value * x))], labels: steps.map(stepLabel) }
}

// A ruler from guides: the logo's edges and the guides, each gap labelled in X
function guideRuler(guides: number[], length: number, x: number, start: number): Ruler {
  const cuts = guideCuts(guides, length, start)
  return { cuts, labels: cuts.slice(1).map((cut, i) => gapLabel(cut - cuts[i], x)) }
}

// Positions of the grid lines between 0 and `size`, one module apart, lined up with the
// logo's box (which starts at `offset`), so a margin of 1.5 modules still meets a line
function gridLines(size: number, offset: number) {
  const first = offset - Math.floor(offset)
  return Array.from({ length: Math.floor(size - first) + 1 }, (_, i) => first + i)
}

// Where a click falls on a band, in the band's own units (its box on screen maps linearly)
function clickAt(event: MouseEvent<SVGRectElement>, axis: 'x' | 'y') {
  const band = event.currentTarget
  const box = band.getBoundingClientRect()
  return axis === 'x'
    ? Number(band.getAttribute('x')) + ((event.clientX - box.left) / (box.width || 1)) * Number(band.getAttribute('width'))
    : Number(band.getAttribute('y')) + ((event.clientY - box.top) / (box.height || 1)) * Number(band.getAttribute('height'))
}

// 3.2 Construction grid, drawn by the app when none is uploaded: square modules fitted to
// the visible part of the logo (its transparent margins are ignored), X of margin around
// it, the logo's box in a dashed line, and X marked at the top. X is the same measure as the
// clear space of 3.1. Rulers above and beside it come from guides the user clicks, or from
// typed steps. Everything is measured in modules, so the SVG scales to any page size.
export function ConstructionGrid({
  logo,
  modules,
  x,
  rulerTop = [],
  rulerSide = [],
  guides = { vertical: [], horizontal: [] },
  onGuidesChange,
}: ConstructionGridProps) {
  const bounds = useVisibleBounds(logo.url)
  const margin = x // X of free room on every side
  const interactive = Boolean(onGuidesChange)

  // The visible logo is `modules` wide; its height follows its own proportions, and it is
  // centred in whole rows of modules
  const logoHeight = logoBox(bounds, modules, margin).height
  const rows = Math.max(1, Math.ceil(logoHeight - 0.001))
  const width = modules + margin * 2
  const height = rows + margin * 2
  const logoTop = margin + (rows - logoHeight) / 2
  const { image } = logoBox(bounds, modules, margin, logoTop)

  // Rulers start at the logo's edges. Guides on an axis replace the typed ruler of that axis.
  const top: Ruler | null =
    guides.vertical.length > 0
      ? guideRuler(guides.vertical, modules, x, margin)
      : rulerTop.length > 0
        ? typedRuler(rulerTop, x, margin)
        : null
  const side: Ruler | null =
    guides.horizontal.length > 0
      ? guideRuler(guides.horizontal, logoHeight, x, logoTop)
      : rulerSide.length > 0
        ? typedRuler(rulerSide, x, logoTop)
        : null

  // While the rulers can be clicked, their bands are always there (empty until a click)
  const topRoom = top || interactive ? TOP_ROOM : 0
  const sideRoom = side || interactive ? SIDE_ROOM : 0
  const gridRight = Math.max(width, top ? top.cuts[top.cuts.length - 1] : 0)
  const totalWidth = LEFT_ROOM + gridRight + sideRoom
  const totalHeight = topRoom + Math.max(height, side ? side.cuts[side.cuts.length - 1] : 0) + BOTTOM_ROOM
  const sideX = gridRight + 0.7 // where the side ruler runs
  const bottomY = height + 0.7 // where the overall width runs, under the grid
  const leftX = -0.7 // where the overall height runs, left of the grid

  const lines = [
    ...gridLines(width, margin).map((i) => `M${i} 0V${height}`),
    ...gridLines(height, margin).map((j) => `M0 ${j}H${width}`),
    `M0 0H${width}V${height}H0Z`, // the outer edge, even when it falls between lines
  ].join('')

  // A click on a band adds a guide there (snapped to half modules), or removes the one there
  function clickTop(event: MouseEvent<SVGRectElement>) {
    const at = snapGuide(clickAt(event, 'x') - margin, modules)
    onGuidesChange?.({ ...guides, vertical: toggleGuide(guides.vertical, at) })
  }

  function clickSide(event: MouseEvent<SVGRectElement>) {
    const at = snapGuide(clickAt(event, 'y') - logoTop, logoHeight)
    onGuidesChange?.({ ...guides, horizontal: toggleGuide(guides.horizontal, at) })
  }

  function removeGuide(axis: keyof Guides, at: number) {
    onGuidesChange?.({ ...guides, [axis]: guides[axis].filter((guide) => guide !== at) })
  }

  return (
    <svg
      className="construction-grid"
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      role="img"
      aria-label="Generated construction grid"
      data-modules={modules}
      data-x={x}
      data-interactive={interactive}
    >
      {/* Everything moved right to leave room for the overall height on the left */}
      <g transform={`translate(${LEFT_ROOM} 0)`}>
        {/* The grid, moved down to leave room for the top ruler */}
        <g transform={`translate(0 ${topRoom})`}>
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
          {!top && (
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
              ...(top ? top.cuts.map((cx) => `M${cx} 0V${height}`) : []),
              ...(side ? side.cuts.map((cy) => `M0 ${cy}H${width}`) : []),
            ].join('')}
          />

          {/* A clicked guide can be clicked again to remove it (a wide, invisible hit line) */}
          {interactive &&
            guides.vertical.map((at) => (
              <line
                key={`v${at}`}
                className="construction-grid-hit"
                data-guide="vertical"
                x1={margin + at}
                x2={margin + at}
                y1={0}
                y2={height}
                onClick={() => removeGuide('vertical', at)}
              />
            ))}
          {interactive &&
            guides.horizontal.map((at) => (
              <line
                key={`h${at}`}
                className="construction-grid-hit"
                data-guide="horizontal"
                x1={0}
                x2={width}
                y1={logoTop + at}
                y2={logoTop + at}
                onClick={() => removeGuide('horizontal', at)}
              />
            ))}

          {interactive && (
            <rect
              className="construction-grid-band"
              data-band="side"
              x={gridRight}
              y={logoTop}
              width={SIDE_ROOM}
              height={logoHeight}
              onClick={clickSide}
            >
              <title>Click to add a guide</title>
            </rect>
          )}

          {/* The logo's overall size in X: width below the grid, height on its left */}
          <g className="construction-grid-ruler" data-ruler="width">
            <path
              d={`M${margin} ${bottomY}H${margin + modules}M${margin} ${bottomY - 0.2}V${bottomY + 0.2}M${margin + modules} ${bottomY - 0.2}V${bottomY + 0.2}`}
            />
            <text x={margin + modules / 2} y={bottomY + 0.55} textAnchor="middle">
              {gapLabel(modules, x)}
            </text>
          </g>
          <g className="construction-grid-ruler" data-ruler="height">
            <path
              d={`M${leftX} ${logoTop}V${logoTop + logoHeight}M${leftX - 0.2} ${logoTop}H${leftX + 0.2}M${leftX - 0.2} ${logoTop + logoHeight}H${leftX + 0.2}`}
            />
            <text x={leftX - 0.35} y={logoTop + logoHeight / 2} textAnchor="end" dominantBaseline="central">
              {gapLabel(logoHeight, x)}
            </text>
          </g>

          {side && (
            <g
              className="construction-grid-ruler"
              data-ruler="side"
              data-length={side.cuts[side.cuts.length - 1] - side.cuts[0]}
            >
              <path
                d={[
                  `M${sideX} ${side.cuts[0]}V${side.cuts[side.cuts.length - 1]}`,
                  ...side.cuts.map((cy) => `M${sideX - 0.2} ${cy}H${sideX + 0.2}`),
                ].join('')}
              />
              {side.labels.map((label, i) => (
                <text
                  key={i}
                  x={sideX + 0.35}
                  y={(side.cuts[i] + side.cuts[i + 1]) / 2}
                  dominantBaseline="central"
                >
                  {label}
                </text>
              ))}
            </g>
          )}
        </g>

        {interactive && (
          <rect
            className="construction-grid-band"
            data-band="top"
            x={margin}
            y={0}
            width={modules}
            height={TOP_ROOM}
            onClick={clickTop}
          >
            <title>Click to add a guide</title>
          </rect>
        )}

        {top && (
          <g
            className="construction-grid-ruler"
            data-ruler="top"
            data-length={top.cuts[top.cuts.length - 1] - top.cuts[0]}
          >
            <path
              d={[
                `M${top.cuts[0]} ${TOP_ROOM * 0.7}H${top.cuts[top.cuts.length - 1]}`,
                ...top.cuts.map((cx) => `M${cx} ${TOP_ROOM * 0.5}V${TOP_ROOM * 0.9}`),
              ].join('')}
            />
            {top.labels.map((label, i) => (
              <text key={i} x={(top.cuts[i] + top.cuts[i + 1]) / 2} y={TOP_ROOM * 0.45} textAnchor="middle">
                {label}
              </text>
            ))}
          </g>
        )}
      </g>
    </svg>
  )
}
