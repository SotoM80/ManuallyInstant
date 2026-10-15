import type { Orientation } from '../../types'
import type { SkinParams } from '../types'

// A page of the manual in mm: the viewBox of every skin (see specs/skins.md, Geometry)
export type Page = { width: number; height: number }

export function pageSize(orientation: Orientation): Page {
  return orientation === 'landscape' ? { width: 297, height: 210 } : { width: 210, height: 297 }
}

export type GradientStop = { offset: number; color: string }

// What a drawing returns: plain numbers and colors, turned into SVG by SkinLayer.
// Radial, Dots and Stripes add their own kinds here.
export type SkinShape = {
  kind: 'linear'
  x1: number
  y1: number
  x2: number
  y2: number
  stops: GradientStop[]
}

// One drawing per preset: its values, the colors in order and the page → what to draw
export type DrawSkin = (params: SkinParams, colors: string[], page: Page) => SkinShape
