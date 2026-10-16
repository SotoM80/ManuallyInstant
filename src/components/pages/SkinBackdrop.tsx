import { useId } from 'react'
import { drawLayer } from '../../skins/draw'
import { pageSize } from '../../skins/draw/types'
import type { GradientStop, Mark, SkinShape } from '../../skins/draw/types'
import type { SkinLayer } from '../../skins/types'
import type { Orientation } from '../../types'

type SkinBackdropProps = {
  layers: SkinLayer[] // in list order: the first one is on top (hidden ones are skipped)
  orientation: Orientation
}

function stops(list: GradientStop[]) {
  return list.map((stop) => <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />)
}

function marks(list: Mark[]) {
  return list.map((mark, i) => {
    switch (mark.type) {
      case 'circle':
        return <circle key={i} cx={mark.cx} cy={mark.cy} r={mark.r} fill={mark.color} />
      case 'rect':
        return <rect key={i} x={mark.x} y={mark.y} width={mark.width} height={mark.height} fill={mark.color} />
      case 'path':
        return <path key={i} d={mark.d} fill={mark.color} />
    }
  })
}

// How a shape is drawn on the page: shapes are their marks, turned around the page's center;
// the others are a paint (a gradient or a pattern tile) under `id`, filling the whole page
function draw(shape: SkinShape, id: string, page: { width: number; height: number }) {
  if (shape.kind === 'shapes') {
    return <g transform={`rotate(${shape.angle} ${page.width / 2} ${page.height / 2})`}>{marks(shape.marks)}</g>
  }
  return (
    <>
      <defs>{paint(shape, id)}</defs>
      <rect width={page.width} height={page.height} fill={`url(#${id})`} />
    </>
  )
}

// The paint of a gradient or a pattern, under the given id
function paint(shape: Exclude<SkinShape, { kind: 'shapes' }>, id: string) {
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
          {marks(shape.marks)}
        </pattern>
      )
  }
}

// The layers of a skin behind the content of a page, in one SVG measured in mm of the A4 page,
// so it looks the same in every view (see specs/skins.md, ADR 0009 and ADR 0010). The first
// layer of the list is on top, so they are drawn from the last one to the first. Decoration only.
export function SkinBackdrop({ layers, orientation }: SkinBackdropProps) {
  // Ids are shared by the whole document, so every SVG has its own prefix and every layer its own id
  const prefix = useId()
  const page = pageSize(orientation)
  const drawn = layers
    .filter((layer) => layer.visible)
    .map((layer) => ({ layer, shape: drawLayer(layer, layer.colors, page) }))
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
            {draw(shape, id, page)}
          </g>
        )
      })}
    </svg>
  )
}
