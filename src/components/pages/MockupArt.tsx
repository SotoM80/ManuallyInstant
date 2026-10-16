import type { MockupPart, MockupProduct } from '../../mockups/types'

type MockupArtProps = {
  product: MockupProduct
  color: string // the product's color, "#RRGGBB"
  logo: { url: string } | null // null → a dashed box where the logo goes
  decorative?: boolean // a small drawing next to its name (the form): hidden from screen readers
}

// The fixed colors of the parts that are not the product's
const FILLS = { shade: '#000000', light: '#FFFFFF' }
const DEFAULT_OPACITY = { product: 1, shade: 0.12, light: 0.35 }

function fill(part: MockupPart, color: string) {
  if (part.fill === 'product') return color
  return part.fill === 'shade' || part.fill === 'light' ? FILLS[part.fill] : part.fill
}

function opacity(part: MockupPart) {
  if (part.opacity !== undefined) return part.opacity
  return part.fill === 'shade' || part.fill === 'light' ? DEFAULT_OPACITY[part.fill] : 1
}

// One product with the logo on it, drawn from its data (see specs/mockups.md and ADR 0013).
// Every color and opacity is an attribute, so the PDF copy draws it as is (ADR 0012).
export function MockupArt({ product, color, logo, decorative = false }: MockupArtProps) {
  const [width, height] = product.viewBox
  const box = product.logo
  const turn = box.rotate ? `rotate(${box.rotate} ${box.x + box.width / 2} ${box.y + box.height / 2})` : undefined
  return (
    <svg
      className="mockup-art"
      viewBox={`0 0 ${width} ${height}`}
      data-mockup={product.id}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': `${product.name} mockup` })}
    >
      {product.parts.map((part, i) => (
        <path
          key={i}
          d={part.d}
          fill={fill(part, color)}
          fillOpacity={opacity(part)}
          stroke={part.outline ? '#000000' : undefined}
          strokeOpacity={part.outline ? 0.22 : undefined}
          strokeWidth={part.outline ? 0.6 : undefined}
          strokeLinejoin={part.outline ? 'round' : undefined}
        />
      ))}
      <g transform={turn}>
        {logo ? (
          <image
            href={logo.url}
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <rect
            className="mockup-logo-placeholder"
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            fill="none"
            stroke="#000000"
            strokeOpacity={0.35}
            strokeWidth={0.6}
            strokeDasharray="2 1.5"
          />
        )}
      </g>
    </svg>
  )
}
