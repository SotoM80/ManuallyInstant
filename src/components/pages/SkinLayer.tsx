import { useId } from 'react'
import { drawSkin } from '../../skins/draw'
import { pageSize } from '../../skins/draw/types'
import type { Skin } from '../../skins/types'
import type { Orientation } from '../../types'

type SkinLayerProps = {
  skin: Skin
  colors: string[] // the skin's colors as HEX, in order (skinColors)
  orientation: Orientation
}

// The skin behind the content of a page: an SVG measured in mm of the A4 page, so it looks
// the same in every view (see specs/skins.md and ADR 0009). It is decoration only.
export function SkinLayer({ skin, colors, orientation }: SkinLayerProps) {
  // Gradient ids are shared by the whole document, so every layer needs its own
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
    >
      <defs>
        <linearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          x1={shape.x1}
          y1={shape.y1}
          x2={shape.x2}
          y2={shape.y2}
        >
          {shape.stops.map((stop) => (
            <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
      </defs>
      <rect width={page.width} height={page.height} fill={`url(#${id})`} />
    </svg>
  )
}
