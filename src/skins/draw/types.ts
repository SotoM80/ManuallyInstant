import type { Orientation } from '../../types'
import type { SkinParams } from '../types'

// A page of the manual in mm: the viewBox of every skin (see specs/skins.md, Geometry)
export type Page = { width: number; height: number }

export function pageSize(orientation: Orientation): Page {
  return orientation === 'landscape' ? { width: 297, height: 210 } : { width: 210, height: 297 }
}

export type GradientStop = { offset: number; color: string }

// A mark of a pattern tile, in mm of the tile
export type PatternMark =
  | { type: 'circle'; cx: number; cy: number; r: number; color: string }
  | { type: 'rect'; x: number; y: number; width: number; height: number; color: string }

// What a drawing returns: plain numbers and colors, turned into SVG by SkinLayer.
// Gradients cover the page; a pattern only draws its marks, so the page shows between them.
export type SkinShape =
  | { kind: 'linear'; x1: number; y1: number; x2: number; y2: number; stops: GradientStop[] }
  | { kind: 'radial'; cx: number; cy: number; r: number; stops: GradientStop[] }
  | { kind: 'pattern'; width: number; height: number; angle: number; marks: PatternMark[] }

// One drawing per preset: its values, the colors in order and the page → what to draw
export type DrawSkin = (params: SkinParams, colors: string[], page: Page) => SkinShape
