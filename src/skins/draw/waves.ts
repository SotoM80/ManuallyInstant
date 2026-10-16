import type { DrawSkin, Mark } from './types'

// Room between two waves, on top of the wave itself
export const WAVE_GAP = 10

// Wavy bands that fill the page, alternating Color A and Color B. `amplitude` is the height of a
// wave from its middle to its top (mm) and `frequency` how many whole waves fit across the page.
// Every band is 2 × amplitude + 10 mm high. The bands are drawn over a square as wide as the page's
// diagonal, so the page stays covered when `angle` turns them around its center.
export const drawWaves: DrawSkin = (params, [a, b], page) => {
  const amplitude = params.amplitude ?? 12
  const wavelength = page.width / Math.max(1, params.frequency ?? 2)
  const band = amplitude * 2 + WAVE_GAP
  const size = Math.hypot(page.width, page.height)
  const left = page.width / 2 - size / 2
  const top = page.height / 2 - size / 2 - band // one band more above, for the first wave's dip
  const steps = Math.ceil((size / wavelength) * 16) // 16 points per wave
  const xs = Array.from({ length: steps + 1 }, (_, i) => left + (size * i) / steps)
  // Waves start at the page's left edge, so the pattern does not move with the square
  const waveY = (x: number, base: number) => base + amplitude * Math.sin((2 * Math.PI * x) / wavelength)
  const curve = (base: number, points: number[]) =>
    points.map((x) => `${round(x)} ${round(waveY(x, base))}`).join(' L ')

  const marks: Mark[] = [{ type: 'rect', x: left, y: top, width: size, height: size + band * 2, color: b }]
  for (let base = top; base < top + size + band * 2; base += band * 2) {
    const d = `M ${curve(base, xs)} L ${curve(base + band, [...xs].reverse())} Z`
    marks.push({ type: 'path', d, color: a })
  }
  return { kind: 'shapes', angle: params.angle ?? 0, marks }
}

const round = (value: number) => Math.round(value * 100) / 100
