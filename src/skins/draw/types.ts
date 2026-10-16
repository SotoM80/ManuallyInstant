import type { Orientation } from '../../types'
import type { SkinParams } from '../types'

// A page of the manual in mm: the viewBox of every skin (see specs/skins.md, Geometry)
export type Page = { width: number; height: number }

export function pageSize(orientation: Orientation): Page {
  return orientation === 'landscape' ? { width: 297, height: 210 } : { width: 210, height: 297 }
}

export type GradientStop = { offset: number; color: string }

// A mark, in mm: of a pattern tile, or of the page for shapes. A path is an SVG path (`d`).
export type Mark =
  | { type: 'circle'; cx: number; cy: number; r: number; color: string }
  | { type: 'rect'; x: number; y: number; width: number; height: number; color: string }
  | { type: 'path'; d: string; color: string }

// One color of a texture: it shows where a channel of the noise is high. Its opacity is
// gain × channel − cut, so a bigger cut leaves fewer, smaller specks.
export type Tint = { color: string; channel: 'r' | 'g' | 'b'; gain: number; cut: number }

// What a drawing returns: plain numbers and colors, turned into SVG by SkinBackdrop.
// Gradients cover the page; a pattern only draws its marks, so what is under it shows between
// them; shapes are marks drawn once on the page, turned by `angle` around its center.
export type SkinShape =
  | { kind: 'linear'; x1: number; y1: number; x2: number; y2: number; stops: GradientStop[] }
  | { kind: 'radial'; cx: number; cy: number; r: number; stops: GradientStop[] }
  | { kind: 'pattern'; width: number; height: number; angle: number; marks: Mark[] }
  | { kind: 'shapes'; angle: number; marks: Mark[] }
  // Noise (feTurbulence) in mm of the page: `frequency` in cycles per mm across and down, over an
  // optional base color. A fixed seed draws the same noise everywhere, the PDF included.
  | { kind: 'texture'; frequency: [number, number]; octaves: number; seed: number; base?: string; tints: Tint[] }

// The direction of a CSS angle in SVG: 0° points up, turning clockwise (y grows downwards)
export function direction(degrees: number) {
  const angle = (degrees * Math.PI) / 180
  return { dx: Math.sin(angle), dy: -Math.cos(angle) }
}

// One drawing per preset: its values, the colors in order and the page → what to draw
export type DrawSkin = (params: SkinParams, colors: string[], page: Page) => SkinShape
