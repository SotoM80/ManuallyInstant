import { useId } from 'react'
import { drawSkin } from '../../skins/draw'
import { pageSize } from '../../skins/draw/types'
import type { GradientStop, SkinShape } from '../../skins/draw/types'
import type { Skin } from '../../skins/types'
import type { Orientation } from '../../types'

type SkinLayerProps = {
  skin: Skin
  colors: string[] // the skin's colors as HEX, in order (skinColors)
  orientation: Orientation
}

function stops(list: GradientStop[]) {
  return list.map((stop) => <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />)
}

// The paint of a shape, under the given id: a gradient, or a pattern tile with its marks
function paint(shape: SkinShape, id: string) {
  switch (shape.kind) {
    case 'linear':
      return (
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2}>
          {stops(shape.stops)}
        </linearGradient>
      )
    case 'radial':
      return (
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={shape.cx} cy={shape.cy} r={shape.r}>
          {stops(shape.stops)}
        </radialGradient>
      )
    case 'pattern':
      return (
        <pattern
          id={id}
          patternUnits="userSpaceOnUse"
          width={shape.width}
          height={shape.height}
          patternTransform={`rotate(${shape.angle})`}
        >
          {shape.marks.map((mark, i) =>
            mark.type === 'circle' ? (
              <circle key={i} cx={mark.cx} cy={mark.cy} r={mark.r} fill={mark.color} />
            ) : (
              <rect key={i} x={mark.x} y={mark.y} width={mark.width} height={mark.height} fill={mark.color} />
            ),
          )}
        </pattern>
      )
  }
}

// The skin behind the content of a page: an SVG measured in mm of the A4 page, so it looks
// the same in every view (see specs/skins.md and ADR 0009). It is decoration only.
export function SkinLayer({ skin, colors, orientation }: SkinLayerProps) {
  // Gradient and pattern ids are shared by the whole document, so every layer needs its own
  const id = useId()
  const page = pageSize(orientation)
  const shape = drawSkin(skin, colors, page)
  if (!shape) return null

  return (
    <svg
      className="skin-layer"
      viewBox={`0 0 ${page.width} ${page.height}`}
      preserveAspectRatio="none"
      opacity={(skin.params.intensity ?? 100) / 100}
      aria-hidden="true"
      data-skin={shape.kind}
    >
      <defs>{paint(shape, id)}</defs>
      <rect width={page.width} height={page.height} fill={`url(#${id})`} />
    </svg>
  )
}
