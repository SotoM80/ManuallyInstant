import { useId } from 'react'
import { drawLayer } from '../../skins/draw'
import { pageSize } from '../../skins/draw/types'
import type { GradientStop, SkinShape } from '../../skins/draw/types'
import { skinColors } from '../../skins/colors'
import type { SkinLayer } from '../../skins/types'
import type { Orientation, PaletteColor } from '../../types'

type SkinBackdropProps = {
  layers: SkinLayer[] // in list order: the first one is on top
  palette: PaletteColor[] | null
  pageColors: { background: string; ink: string } // the Cover's colors, which fill in for missing ones
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

// The layers of a skin behind the content of a page, in one SVG measured in mm of the A4 page,
// so it looks the same in every view (see specs/skins.md, ADR 0009 and ADR 0010). The first
// layer of the list is on top, so they are drawn from the last one to the first. Decoration only.
export function SkinBackdrop({ layers, palette, pageColors, orientation }: SkinBackdropProps) {
  // Ids are shared by the whole document, so every SVG has its own prefix and every layer its own id
  const prefix = useId()
  const page = pageSize(orientation)
  const drawn = layers
    .filter((layer) => layer.visible)
    .map((layer) => ({ layer, shape: drawLayer(layer, skinColors(palette, layer.colors, pageColors), page) }))
    .filter((entry): entry is { layer: SkinLayer; shape: SkinShape } => entry.shape !== null)
    .reverse()
  if (drawn.length === 0) return null

  return (
    <svg
      className="skin-layer"
      viewBox={`0 0 ${page.width} ${page.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {drawn.map(({ layer, shape }) => {
        const id = `${prefix}-layer-${layer.id}`
        return (
          <g key={layer.id} opacity={(layer.params.intensity ?? 100) / 100} data-skin={shape.kind}>
            <defs>{paint(shape, id)}</defs>
            <rect width={page.width} height={page.height} fill={`url(#${id})`} />
          </g>
        )
      })}
    </svg>
  )
}
