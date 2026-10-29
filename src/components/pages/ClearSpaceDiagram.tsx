import { logoBox } from '../../utils/logoBox'
import { FULL_BOUNDS, useVisibleBounds } from '../../utils/visibleBounds'

type ClearSpaceDiagramProps = {
  logo: { url: string } | null // the Primary version, or the Cover's logo
  name: string // the Primary version's name, for the image's alt text
  modules: number // the grid's modules across the logo (sets the size of X)
  x: number // how many modules X measures
  background?: string | null // Version 1's, filling the area inside the dashed edge
}

// With no logo yet, an empty box twice as wide as it is tall stands for it
const EMPTY_BOUNDS = { ...FULL_BOUNDS, ratio: 2 }

// 3.1 Clear space: the logo (its visible part, as in the construction grid of 3.2), X of free
// room on every side, and the dashed edge of that area. Measured in the same modules as 3.2,
// so X is exactly the same measure in both blocks.
export function ClearSpaceDiagram({ logo, name, modules, x, background = null }: ClearSpaceDiagramProps) {
  const read = useVisibleBounds(logo?.url ?? null)
  const bounds = logo ? read : EMPTY_BOUNDS
  const { height: logoHeight, image } = logoBox(bounds, modules, x)
  const width = modules + x * 2
  const height = logoHeight + x * 2
  // "X" in the middle of each side of the free area, sized to fit inside it
  const labelSize = Math.min(0.7, x * 0.6)
  const labels = [
    { side: 'top', cx: width / 2, cy: x / 2 },
    { side: 'bottom', cx: width / 2, cy: height - x / 2 },
    { side: 'left', cx: x / 2, cy: height / 2 },
    { side: 'right', cx: width - x / 2, cy: height / 2 },
  ]

  return (
    <svg className="clearspace-svg" viewBox={`0 0 ${width} ${height}`} data-x={x}>
      {/* An inline style: the stylesheet's `.clearspace-svg rect { fill: none }` beats a fill attribute */}
      {background && (
        <rect
          className="clearspace-area-fill"
          x={0}
          y={0}
          width={width}
          height={height}
          style={{ fill: background, stroke: 'none' }}
        />
      )}
      <rect className="clearspace-area-edge" x={0} y={0} width={width} height={height} />
      <rect
        className="clearspace-logo-box"
        data-empty={!logo}
        x={x}
        y={x}
        width={modules}
        height={logoHeight}
      />
      {logo && (
        <image
          role="img"
          aria-label={`${name} version`}
          href={logo.url}
          {...image}
          preserveAspectRatio="none"
        />
      )}
      {labels.map((label) => (
        <text
          key={label.side}
          className="clearspace-label"
          x={label.cx}
          y={label.cy}
          fontSize={labelSize}
          textAnchor="middle"
          dominantBaseline="central"
          aria-hidden="true"
        >
          X
        </text>
      ))}
    </svg>
  )
}
