import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { PhotoMockup } from './pages/PhotoMockup'
import { MOCKUP_GROUPS } from '../mockups/products'
import { DEFAULT_PLACEMENT, defaultSettings } from '../mockups/mockups'
import { brush, combineMasks, emptyMask, magicWand, selectedShare, softenMask } from '../mockups/selection'
import type { Mask, SelectMode } from '../mockups/selection'
import { drawSelection, loadEditorMask, loadEditorPhoto, maskToDataUrl } from '../mockups/editorImage'
import type { EditorPhoto } from '../mockups/editorImage'
import { areaGrid, gridBounds, gridFromRect, gridPoint, movePoint, resampleGrid } from '../mockups/warp'
import type { AreaGrid, MockupGroup, PhotoTemplate } from '../mockups/types'

// The template editor (see specs/mockups.md, The template editor): select the product with the
// magic wand and the brush, draw where the logo goes, see the result, then use the template in
// this session or download it. Opened over the page from a photo mockup's block, or with a photo
// the user uploads.
type TemplateEditorProps = {
  template: PhotoTemplate // the template to edit (a new one has no mask yet)
  logo: { url: string } | null // to see the result with the real logo
  onSave: (template: PhotoTemplate) => void
  onClose: () => void
}

type Tool = 'wand' | 'brush' | 'erase' | 'area'
const TOOLS: { tool: Tool; label: string }[] = [
  { tool: 'wand', label: 'Magic wand' },
  { tool: 'brush', label: 'Brush' },
  { tool: 'erase', label: 'Eraser' },
  { tool: 'area', label: 'Logo area' },
]

const WAND_MODES: { mode: SelectMode; label: string }[] = [
  { mode: 'replace', label: 'New' },
  { mode: 'add', label: 'Add' },
  { mode: 'subtract', label: 'Subtract' },
]

// The selection is shown in the app's accent purple over the photo
const SELECTION_TINT: [number, number, number] = [170, 59, 255]
const SOFT_EDGE = 2 // editor pixels
const UNDO_STEPS = 20

// Downloads a file the browser holds
function download(url: string, name: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
}

export function TemplateEditor({ template, logo, onSave, onClose }: TemplateEditorProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [photo, setPhoto] = useState<EditorPhoto | null>(null)
  const [failed, setFailed] = useState(false)
  const [mask, setMask] = useState<Mask | null>(null)
  const [history, setHistory] = useState<Mask[]>([])
  const [tool, setTool] = useState<Tool>('wand')
  const [wandMode, setWandMode] = useState<SelectMode>('replace')
  const [tolerance, setTolerance] = useState(25)
  const [brushSize, setBrushSize] = useState(20)
  const [grid, setGrid] = useState<AreaGrid>(areaGrid(template))
  const [movingPoint, setMovingPoint] = useState<number | null>(null)
  const [name, setName] = useState(template.name)
  const [group, setGroup] = useState<MockupGroup>(template.group)
  const [color, setColor] = useState(template.color)
  const [tintable, setTintable] = useState(template.tintable)
  const [preview, setPreview] = useState<PhotoTemplate | null>(null)
  const [message, setMessage] = useState('')
  const stroke = useRef<{ last: [number, number]; area?: [number, number] } | null>(null)

  // Load the photo and the template's current mask
  useEffect(() => {
    let current = true
    ;(async () => {
      try {
        const loaded = await loadEditorPhoto(template.image)
        const { width, height } = loaded.pixels
        const start = await loadEditorMask({ polygons: template.mask, image: template.maskImage }, width, height, loaded.scale)
        if (!current) return
        setPhoto(loaded)
        setMask(start)
        // A new photo has no area yet: the middle of the photo
        if (template.area.width === 0) {
          const [w, h] = loaded.size
          setGrid(gridFromRect({ x: Math.round(w * 0.3), y: Math.round(h * 0.3), width: Math.round(w * 0.4), height: Math.round(h * 0.25) }))
        }
      } catch {
        if (current) setFailed(true)
      }
    })()
    return () => {
      current = false
    }
  }, [template])

  // Draw the photo with the selection over it
  useEffect(() => {
    if (photo && mask && canvas.current) drawSelection(canvas.current, photo, mask, SELECTION_TINT)
  }, [photo, mask])

  // Escape closes the editor
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function remember(next: Mask) {
    if (mask) setHistory((past) => [...past.slice(-UNDO_STEPS + 1), mask])
    setMask(next)
    setPreview(null)
  }

  function undo() {
    setHistory((past) => {
      const previous = past.at(-1)
      if (previous) setMask(previous)
      return past.slice(0, -1)
    })
  }

  // A pointer on the canvas, in the editor's pixels
  function at(event: PointerEvent<HTMLCanvasElement>): [number, number] {
    const box = event.currentTarget.getBoundingClientRect()
    const { width, height } = photo!.pixels
    return [((event.clientX - box.left) * width) / (box.width || 1), ((event.clientY - box.top) * height) / (box.height || 1)]
  }

  function down(event: PointerEvent<HTMLCanvasElement>) {
    if (!photo || !mask) return
    const point = at(event)
    event.currentTarget.setPointerCapture?.(event.pointerId)
    if (tool === 'wand') {
      const mode: SelectMode = event.shiftKey ? 'add' : event.altKey ? 'subtract' : wandMode
      remember(combineMasks(mask, magicWand(photo.pixels, point[0], point[1], tolerance), mode))
    } else if (tool === 'area') {
      stroke.current = { last: point, area: point }
    } else {
      stroke.current = { last: point }
      remember(brush(mask, point, point, brushSize / 2, tool === 'erase'))
    }
  }

  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (!stroke.current || !photo || !mask) return
    const point = at(event)
    if (tool === 'area' && stroke.current.area) {
      // A drag on the photo draws a new straight area, with as many points as the current one
      const [x0, y0] = stroke.current.area
      const toPhoto = 1 / photo.scale
      const box = {
        x: Math.round(Math.min(x0, point[0]) * toPhoto),
        y: Math.round(Math.min(y0, point[1]) * toPhoto),
        width: Math.round(Math.abs(point[0] - x0) * toPhoto),
        height: Math.round(Math.abs(point[1] - y0) * toPhoto),
      }
      setGrid((current) => resampleGrid(gridFromRect(box), current.cols, current.rows))
      setPreview(null)
    } else if (tool === 'brush' || tool === 'erase') {
      // From the newest mask: several moves can arrive before the next render
      const last = stroke.current.last
      stroke.current.last = point
      setMask((current) => current && brush(current, last, point, brushSize / 2, tool === 'erase'))
    }
  }

  function up() {
    stroke.current = null
  }

  // The template as it is now, ready to use or to preview
  function build(): PhotoTemplate | null {
    if (!photo || !mask) return null
    if (selectedShare(mask) === 0) {
      setMessage('Select the product first: click it with the magic wand.')
      return null
    }
    const area = gridBounds(grid)
    if (area.width < 4 || area.height < 4) {
      setMessage('Draw where the logo goes with the Logo area tool.')
      return null
    }
    setMessage('')
    return {
      ...template,
      name: name.trim() || template.name,
      group,
      size: photo.size,
      mask: [],
      maskImage: maskToDataUrl(softenMask(mask, SOFT_EDGE)),
      area,
      grid,
      color,
      tintable,
      revision: Date.now(),
    }
  }

  function save() {
    const built = build()
    if (built) onSave(built)
  }

  function downloadTemplate() {
    const built = build()
    if (!built) return
    // A photo the user uploaded only lives in this session: download it too, with the path it
    // would have in public/mockups/
    const ownPhoto = built.image.startsWith('blob:')
    const file = { ...built, image: ownPhoto ? `/mockups/${built.id}.jpg` : built.image, revision: undefined }
    download(URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })), `${built.id}.json`)
    if (ownPhoto) download(built.image, `${built.id}.jpg`)
  }

  const [photoWidth, photoHeight] = photo?.size ?? template.size

  // The area's outline and its inner lines, drawn along its curves
  const lines: string[] = []
  const trace = (at: (t: number) => [number, number]) =>
    Array.from({ length: 25 }, (_, k) => at(k / 24).join(',')).join(' ')
  for (let r = 0; r < grid.rows; r++) lines.push(trace((t) => gridPoint(grid, t, r / (grid.rows - 1))))
  for (let c = 0; c < grid.cols; c++) lines.push(trace((t) => gridPoint(grid, c / (grid.cols - 1), t)))

  // Dragging a point of the area, in the photo's pixels
  function dragPoint(event: PointerEvent<SVGCircleElement>) {
    if (movingPoint === null) return
    const svg = event.currentTarget.ownerSVGElement!
    const box = svg.getBoundingClientRect()
    const x = ((event.clientX - box.left) * photoWidth) / (box.width || 1)
    const y = ((event.clientY - box.top) * photoHeight) / (box.height || 1)
    setGrid((current) => movePoint(current, movingPoint, [Math.round(x), Math.round(y)]))
    setPreview(null)
  }

  return createPortal(
    <div className="template-editor-backdrop">
      <div className="template-editor" role="dialog" aria-modal="true" aria-label="Template editor">
        <header className="template-editor-header">
          <h2>Template editor</h2>
          <button type="button" className="palette-secondary-button" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="template-editor-body">
          <div className="template-editor-stage">
            {failed && <p role="alert">The photo could not be loaded.</p>}
            {!failed && !photo && <p>Loading the photo…</p>}
            {photo && (
              <div className="template-editor-canvas" data-tool={tool}>
                <canvas
                  ref={canvas}
                  aria-label="Photo: click the product to select it"
                  onPointerDown={down}
                  onPointerMove={move}
                  onPointerUp={up}
                  onPointerCancel={up}
                />
                <svg
                  className="template-editor-area"
                  viewBox={`0 0 ${photoWidth} ${photoHeight}`}
                  preserveAspectRatio="none"
                  data-active={tool === 'area'}
                >
                  {lines.map((points, i) => (
                    <polyline key={i} points={points} fill="none" />
                  ))}
                  {tool === 'area' &&
                    grid.points.map(([x, y], i) => (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r={Math.max(photoWidth, photoHeight) * 0.012}
                        role="slider"
                        tabIndex={0}
                        aria-label={`Point ${i + 1} of the logo area`}
                        aria-valuetext={`${x}, ${y}`}
                        onPointerDown={(event) => {
                          event.stopPropagation()
                          event.currentTarget.setPointerCapture?.(event.pointerId)
                          setMovingPoint(i)
                        }}
                        onPointerMove={dragPoint}
                        onPointerUp={() => setMovingPoint(null)}
                      />
                    ))}
                </svg>
              </div>
            )}
          </div>

          <div className="template-editor-tools">
            <fieldset className="segmented-control">
              <legend>Tool</legend>
              {TOOLS.map((option) => (
                <label key={option.tool}>
                  <input type="radio" name="editor-tool" checked={tool === option.tool} onChange={() => setTool(option.tool)} />
                  <span>{option.label}</span>
                </label>
              ))}
            </fieldset>

            {tool === 'wand' && (
              <>
                <fieldset className="segmented-control">
                  <legend>Selection</legend>
                  {WAND_MODES.map((option) => (
                    <label key={option.mode}>
                      <input
                        type="radio"
                        name="editor-wand-mode"
                        checked={wandMode === option.mode}
                        onChange={() => setWandMode(option.mode)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </fieldset>
                <div className="skin-control">
                  <label htmlFor="editor-tolerance">Tolerance</label>
                  <input
                    id="editor-tolerance"
                    type="range"
                    min={1}
                    max={80}
                    value={tolerance}
                    onChange={(event) => setTolerance(Number(event.target.value))}
                  />
                  <output htmlFor="editor-tolerance">{tolerance}%</output>
                </div>
                <p className="logo-form-hint">Click the product. Shift + click adds to the selection, Alt + click takes away.</p>
              </>
            )}
            {(tool === 'brush' || tool === 'erase') && (
              <div className="skin-control">
                <label htmlFor="editor-brush">Brush size</label>
                <input
                  id="editor-brush"
                  type="range"
                  min={4}
                  max={120}
                  value={brushSize}
                  onChange={(event) => setBrushSize(Number(event.target.value))}
                />
                <output htmlFor="editor-brush">{brushSize}px</output>
              </div>
            )}
            {tool === 'area' && (
              <>
                <p className="logo-form-hint">
                  Drag over the photo to draw the area, then drag its points: the corners for an angle, the points in
                  between for a curve (the side of a mug).
                </p>
                <div className="skin-color">
                  <label htmlFor="editor-cols">Points across</label>
                  <select
                    id="editor-cols"
                    value={grid.cols}
                    onChange={(event) => setGrid((current) => resampleGrid(current, Number(event.target.value), current.rows))}
                  >
                    {[2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="skin-color">
                  <label htmlFor="editor-rows">Points down</label>
                  <select
                    id="editor-rows"
                    value={grid.rows}
                    onChange={(event) => setGrid((current) => resampleGrid(current, current.cols, Number(event.target.value)))}
                  >
                    {[2, 3].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="template-editor-row">
              <button type="button" className="palette-secondary-button" onClick={undo} disabled={history.length === 0}>
                Undo
              </button>
              <button
                type="button"
                className="palette-secondary-button"
                onClick={() => photo && remember(emptyMask(photo.pixels.width, photo.pixels.height))}
              >
                Clear selection
              </button>
            </div>

            <label htmlFor="editor-name">Name</label>
            <input id="editor-name" type="text" value={name} onChange={(event) => setName(event.target.value)} />
            <label htmlFor="editor-group">Group</label>
            <select id="editor-group" value={group} onChange={(event) => setGroup(event.target.value as MockupGroup)}>
              {MOCKUP_GROUPS.map((option) => (
                <option key={option.group} value={option.group}>
                  {option.label}
                </option>
              ))}
            </select>
            <label htmlFor="editor-color">Default color</label>
            <input id="editor-color" type="color" value={color} onChange={(event) => setColor(event.target.value.toUpperCase())} />
            <label className="skin-check">
              <input type="checkbox" checked={tintable} onChange={(event) => setTintable(event.target.checked)} />
              The product can be tinted
            </label>

            {message && (
              <p className="export-message" role="alert">
                {message}
              </p>
            )}

            <button type="button" className="palette-secondary-button" onClick={() => setPreview(build())}>
              See the result
            </button>
            {preview && (
              <div className="template-editor-preview">
                <PhotoMockup
                  template={preview}
                  settings={{ ...defaultSettings(preview), placement: DEFAULT_PLACEMENT }}
                  logo={logo}
                  width={600}
                />
              </div>
            )}

            <div className="template-editor-row">
              <button type="button" className="palette-secondary-button" onClick={downloadTemplate}>
                Download template
              </button>
              <button type="button" className="accent-button" onClick={save}>
                Use now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
