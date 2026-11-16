import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { MockupArt } from './pages/MockupArt'
import { PhotoMockup } from './pages/PhotoMockup'
import { SkinColorField } from './SkinColorField'
import { TemplateEditor } from './TemplateEditor'
import { GeneratePhotoPanel } from './GeneratePhotoPanel'
import { MOCKUP_GROUPS } from '../mockups/products'
import { savePhotoTemplate, useMockupCatalog } from '../mockups/catalog'
import { ROTATION_LIMIT, SIZE_LIMITS, dragPlacement } from '../mockups/geometry'
import { areaGrid, clampOnGrid, logoOutline, surfaceSize } from '../mockups/warp'
import {
  DEFAULT_PLACEMENT,
  EXTRA_LIMITS,
  MAX_EXTRA,
  MAX_MOCKUPS,
  chosenVersion,
  extraLayout,
  extraPhotos,
  mockupLogo,
  moveExtra,
  parseVersionValue,
  placeNewMockup,
  removeExtra,
  setExtraLayout,
  setMockupBlend,
  setMockupColor,
  setMockupPlacement,
  setMockupVersion,
  settingsFor,
  toggleMockup,
  versionOptions,
  versionValue,
} from '../mockups/mockups'
import { extraMockupsPage } from '../data/manualSections'
import { keepInPlace } from '../utils/scrollAnchor'
import type { MockupItem, MockupSettings, Mockups, Placement, PhotoTemplate } from '../mockups/types'
import type { CoverData, LogoData, PaletteColor } from '../types'

// Form of the Mockups section: the products as checkboxes (up to four), then the settings of each
// ticked one, folded like the layers of the Skin: for a photo mockup, where its logo sits and how
// it blends; then its color and its logo version. Everything reaches the preview at once
// (see specs/mockups.md).
type MockupsFormProps = {
  mockups: Mockups
  onChange: (mockups: Mockups) => void
  logo: LogoData | null
  cover: CoverData | null
  palette: PaletteColor[] | null // offered as chips that copy a color
}

// The proportions of an image, once it has loaded (1 meanwhile)
function useImageAspect(url: string | null) {
  const [aspect, setAspect] = useState<{ url: string; value: number } | null>(null)
  useEffect(() => {
    if (!url) return
    const image = new Image()
    image.onload = () => setAspect({ url, value: image.naturalWidth / image.naturalHeight || 1 })
    image.src = url
  }, [url])
  return aspect && aspect.url === url ? aspect.value : 1
}

// A small picture of a product next to its name: decoration only
function Thumbnail({ item, settings }: { item: MockupItem; settings: MockupSettings }) {
  return (
    <span className="mockup-thumb">
      {item.kind === 'photo' ? (
        <img src={item.image} alt="" aria-hidden="true" />
      ) : (
        <MockupArt product={item} color={settings.color} logo={null} decorative />
      )}
    </span>
  )
}

// A photo mockup where the logo can be dragged (or moved with the arrow keys) inside its area.
// The logo's outline follows the area's shape (an angle, a curve); while dragging, only the
// outline moves, and the mockup is composed again when it is let go, so the drag stays smooth.
function PlacementPreview({
  template,
  settings,
  logo,
  onPlacement,
}: {
  template: PhotoTemplate
  settings: MockupSettings
  logo: { url: string } | null
  onPlacement: (placement: Placement) => void
}) {
  const frame = useRef<HTMLDivElement>(null)
  const start = useRef<{ x: number; y: number; placement: Placement } | null>(null)
  const [dragging, setDragging] = useState<Placement | null>(null)
  const aspect = useImageAspect(logo?.url ?? null)
  const grid = areaGrid(template)
  const placement = dragging ?? settings.placement
  const [photoWidth, photoHeight] = template.size
  const outline = logoOutline(grid, aspect, placement)
    .map(([x, y]) => `${x},${y}`)
    .join(' ')

  function moved(event: PointerEvent<SVGElement>) {
    if (!start.current || !frame.current) return placement
    const next = dragPlacement(
      start.current.placement,
      event.clientX - start.current.x,
      event.clientY - start.current.y,
      frame.current.getBoundingClientRect().width || 1,
      photoWidth,
      surfaceSize(grid),
    )
    return clampOnGrid(grid, aspect, next)
  }

  function nudge(event: KeyboardEvent<SVGElement>) {
    const steps: Record<string, [number, number]> = {
      ArrowLeft: [-0.02, 0],
      ArrowRight: [0.02, 0],
      ArrowUp: [0, -0.02],
      ArrowDown: [0, 0.02],
    }
    const step = steps[event.key]
    if (!step) return
    event.preventDefault()
    const next = { ...settings.placement, x: settings.placement.x + step[0], y: settings.placement.y + step[1] }
    onPlacement(clampOnGrid(grid, aspect, next))
  }

  return (
    <div className="placement-preview" ref={frame}>
      <PhotoMockup template={template} settings={settings} logo={logo} width={700} />
      {logo && (
        <svg className="placement-overlay" viewBox={`0 0 ${photoWidth} ${photoHeight}`} preserveAspectRatio="none">
          <polygon
            className="placement-handle"
            points={outline}
            data-dragging={dragging !== null}
            role="slider"
            tabIndex={0}
            aria-label={`Move the logo on the ${template.name}`}
            aria-valuetext={`${Math.round(placement.x * 100)}% across, ${Math.round(placement.y * 100)}% down`}
            onKeyDown={nudge}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture?.(event.pointerId)
              start.current = { x: event.clientX, y: event.clientY, placement: settings.placement }
              setDragging(settings.placement)
            }}
            onPointerMove={(event) => {
              if (start.current) setDragging(moved(event))
            }}
            onPointerUp={(event) => {
              const final = moved(event)
              start.current = null
              setDragging(null)
              onPlacement(final)
            }}
          />
        </svg>
      )}
    </div>
  )
}

// The whole numbers from min to max
function range({ min, max }: { min: number; max: number }) {
  return Array.from({ length: max - min + 1 }, (_, i) => min + i)
}

// A photo the user can upload to make their own template (see specs/mockups.md)
const PHOTO_TYPES = ['image/jpeg', 'image/png']
const MAX_PHOTO_BYTES = 10 * 1024 * 1024

export function MockupsForm({ mockups, onChange, logo, cover, palette }: MockupsFormProps) {
  const catalog = useMockupCatalog()
  const [openId, setOpenId] = useState<string | null>(null) // null → every block folded
  const [editing, setEditing] = useState<PhotoTemplate | null>(null) // the template in the editor
  const [uploadError, setUploadError] = useState('')
  const [placedNote, setPlacedNote] = useState('') // where Use now put a new photo (ADR 0036)
  const [extraOpen, setExtraOpen] = useState(false) // the More pages block

  // An uploaded photo opens the editor as a new template of this session
  function upload(file: File | undefined) {
    if (!file) return
    if (!PHOTO_TYPES.includes(file.type) || file.size > MAX_PHOTO_BYTES) {
      setUploadError('Use a JPG or PNG photo, up to 10 MB')
      return
    }
    setUploadError('')
    openPhoto(URL.createObjectURL(file), file.name.replace(/\.[^.]+$/, ''))
  }

  // An uploaded or a generated photo: the same new template of this session, in the editor.
  // Its id is the first one free in the list, so a form mounted again never reuses one. It starts
  // untinted: the user's own photo often has its colors and its logo already, and Use now then
  // needs no selection (ADR 0036).
  function openPhoto(image: string, name: string) {
    let n = 1
    while (catalog.some((item) => item.id === `upload-${n}`)) n += 1
    setPlacedNote('')
    setEditing({
      kind: 'photo',
      id: `upload-${n}`,
      name: name || 'My photo',
      group: 'apparel',
      image,
      size: [0, 0], // read by the editor
      mask: [],
      area: { x: 0, y: 0, width: 0, height: 0 }, // placed by the editor
      color: '#FFFFFF',
      colorLabel: 'Product color',
      tintable: false,
    })
  }

  // "Use now": the template joins the list for this session; a new one goes to a new extra mockup
  // page when mockups are already ticked, otherwise it is ticked (ADR 0036)
  function useTemplate(template: PhotoTemplate) {
    const isNew = !catalog.some((item) => item.id === template.id)
    savePhotoTemplate(template)
    setEditing(null)
    if (!isNew) return
    const placed = placeNewMockup(mockups, template)
    onChange(placed.mockups)
    if (placed.place === 'page') {
      setOpenId(template.id)
      setPlacedNote('')
    } else if (placed.place === 'extra') {
      const position = extraPhotos(placed.mockups).length - 1
      const { cols, rows } = extraLayout(placed.mockups)
      setPlacedNote(`Added to a new page (${extraMockupsPage(Math.floor(position / (cols * rows)) + 1)}).`)
      setExtraOpen(true)
    } else {
      setPlacedNote(`The extra pages are full (${MAX_EXTRA} photos).`)
    }
  }
  const full = mockups.chosen.length >= MAX_MOCKUPS
  const options = versionOptions(logo)
  // The photos of the extra pages, and their grid and margin (ADR 0036)
  const extra = extraPhotos(mockups)
    .map((id) => catalog.find((item) => item.id === id))
    .filter((item) => item?.kind === 'photo')
  const layout = extraLayout(mockups)

  // Ticking a product opens its block (and folds the open one)
  function toggle(id: string) {
    const ticking = !mockups.chosen.includes(id)
    onChange(toggleMockup(mockups, id))
    if (ticking) setOpenId(id)
    else if (openId === id) setOpenId(null)
  }

  function photoSettings(template: PhotoTemplate, settings: MockupSettings, shown: { url: string } | null) {
    const sizeId = `mockup-${template.id}-size`
    const rotationId = `mockup-${template.id}-rotation`
    const blendId = `mockup-${template.id}-blend`
    const place = (placement: Placement) => onChange(setMockupPlacement(mockups, template.id, placement))
    return (
      <>
        <PlacementPreview template={template} settings={settings} logo={shown} onPlacement={place} />
        <div className="skin-control">
          <label htmlFor={sizeId}>Size</label>
          <input
            id={sizeId}
            type="range"
            min={SIZE_LIMITS.min * 100}
            max={SIZE_LIMITS.max * 100}
            step={5}
            value={Math.round(settings.placement.scale * 100)}
            onChange={(event) => place({ ...settings.placement, scale: Number(event.target.value) / 100 })}
          />
          <output htmlFor={sizeId}>{Math.round(settings.placement.scale * 100)}%</output>
        </div>
        <div className="skin-control">
          <label htmlFor={rotationId}>Rotation</label>
          <input
            id={rotationId}
            type="range"
            min={-ROTATION_LIMIT}
            max={ROTATION_LIMIT}
            step={5}
            value={settings.placement.rotate}
            onChange={(event) => place({ ...settings.placement, rotate: Number(event.target.value) })}
          />
          <output htmlFor={rotationId}>{settings.placement.rotate}°</output>
        </div>
        <button type="button" className="palette-secondary-button" onClick={() => place(DEFAULT_PLACEMENT)}>
          Reset
        </button>
        <div className="skin-color">
          <label htmlFor={blendId}>Blend</label>
          <select
            id={blendId}
            aria-label={`${template.name} blend`}
            value={settings.blend}
            onChange={(event) =>
              onChange(setMockupBlend(mockups, template.id, event.target.value === 'solid' ? 'solid' : 'printed'))
            }
          >
            <option value="printed">Printed</option>
            <option value="solid">Solid</option>
          </select>
        </div>
        <p className="logo-form-hint">Printed suits dark logos. A white logo needs Solid, or it vanishes into the photo.</p>
        <button type="button" className="palette-secondary-button" onClick={() => setEditing(template)}>
          Edit template
        </button>
      </>
    )
  }

  return (
    <form onSubmit={(event) => event.preventDefault()} noValidate aria-label="Mockups">
      <fieldset className="mockup-products">
        <legend>Products</legend>
        {MOCKUP_GROUPS.map((group) => {
          const items = catalog.filter((item) => item.group === group.group)
          if (items.length === 0) return null
          return (
            <div key={group.group} className="mockup-group">
              <p className="skin-gallery-heading">{group.label}</p>
              {items.map((item) => {
                const ticked = mockups.chosen.includes(item.id)
                return (
                  <label key={item.id} className="mockup-choice">
                    <input
                      type="checkbox"
                      checked={ticked}
                      disabled={!ticked && full}
                      onChange={() => toggle(item.id)}
                    />
                    <Thumbnail item={item} settings={settingsFor(mockups, item)} />
                    {item.name}
                    {item.kind === 'photo' && (
                      <span className="mockup-tag" aria-hidden="true">
                        Photo
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
          )
        })}
      </fieldset>
      {full && <p className="logo-form-hint">Up to {MAX_MOCKUPS} mockups.</p>}

      <div className="file-field mockup-upload">
        <label htmlFor="mockup-upload" className="palette-secondary-button">
          Upload your own photo
        </label>
        <input
          id="mockup-upload"
          type="file"
          accept={PHOTO_TYPES.join(',')}
          aria-invalid={uploadError !== ''}
          onChange={(event) => {
            upload(event.target.files?.[0])
            event.target.value = '' // the same file can be chosen again
          }}
        />
      </div>
      {uploadError && (
        <p className="export-message" role="alert">
          {uploadError}
        </p>
      )}
      {placedNote && (
        <p className="logo-form-hint" role="status">
          {placedNote}
        </p>
      )}
      <GeneratePhotoPanel onPhoto={openPhoto} />

      {mockups.chosen.map((id) => {
        const item = catalog.find((other) => other.id === id)
        if (!item) return null
        const settings = settingsFor(mockups, item)
        const shown = mockupLogo(logo, cover?.logo ?? null, settings.version)
        const isOpen = openId === item.id
        const bodyId = `mockup-${item.id}-body`
        const selectId = `mockup-${item.id}-logo`
        // A removed version reads Primary; one with no image yet stays chosen (chosenVersion)
        const version = chosenVersion(logo, settings.version)
        return (
          <div key={item.id} className="palette-block mockup-settings" data-open={isOpen}>
            <button
              type="button"
              className="palette-block-header"
              aria-expanded={isOpen}
              aria-controls={bodyId}
              onClick={(event) => {
                keepInPlace(event.currentTarget) // the block above may fold
                setOpenId(isOpen ? null : item.id)
              }}
            >
              <span className="mockup-thumb">
                {item.kind === 'photo' ? (
                  <img src={item.image} alt="" aria-hidden="true" />
                ) : (
                  <MockupArt product={item} color={settings.color} logo={shown} decorative />
                )}
              </span>
              <span className="palette-block-title">{item.name}</span>
              <span className="palette-block-chevron" aria-hidden="true" />
            </button>

            {/* Always in the page so it can fold and unfold; inert while folded */}
            <div id={bodyId} className="palette-block-body" inert={!isOpen}>
              <div className="palette-block-inner">
                {/* Composing a photo mockup costs: only the open block draws its preview */}
                {item.kind === 'photo' && isOpen && photoSettings(item, settings, shown)}
                <SkinColorField
                  label={`${item.name} ${item.colorLabel.toLowerCase()}`}
                  value={settings.color}
                  onChange={(hex) => onChange(setMockupColor(mockups, item.id, hex))}
                  palette={palette}
                />
                <div className="skin-color">
                  <label htmlFor={selectId}>Logo</label>
                  <select
                    id={selectId}
                    aria-label={`${item.name} logo`}
                    value={versionValue(version)}
                    onChange={(event) => onChange(setMockupVersion(mockups, item.id, parseVersionValue(event.target.value)))}
                  >
                    {options.map((option) => (
                      <option key={versionValue(option.value)} value={versionValue(option.value)}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {extra.length > 0 && (
        <div className="palette-block mockup-settings" data-open={extraOpen}>
          <button
            type="button"
            className="palette-block-header"
            aria-expanded={extraOpen}
            aria-controls="mockup-extra-body"
            onClick={(event) => {
              keepInPlace(event.currentTarget)
              setExtraOpen(!extraOpen)
            }}
          >
            <span className="palette-block-title">More pages</span>
            <span className="palette-block-chevron" aria-hidden="true" />
          </button>
          <div id="mockup-extra-body" className="palette-block-body" inert={!extraOpen}>
            <div className="palette-block-inner">
              <ol className="mockup-extra-list">
                {extra.map((template, i) => {
                  const settings = settingsFor(mockups, template)
                  const version = chosenVersion(logo, settings.version)
                  const shown = mockupLogo(logo, cover?.logo ?? null, settings.version)
                  const selectId = `mockup-extra-${template.id}-logo`
                  return (
                    <li key={template.id} className="mockup-extra-item">
                      <div className="mockup-extra-head">
                        <span className="mockup-thumb">
                          <img src={template.image} alt="" aria-hidden="true" />
                        </span>
                        <span className="palette-block-title">{template.name}</span>
                      </div>
                      <div className="skin-color">
                        <label htmlFor={selectId}>Logo</label>
                        <select
                          id={selectId}
                          aria-label={`${template.name} logo`}
                          value={versionValue(version)}
                          onChange={(event) =>
                            onChange(setMockupVersion(mockups, template.id, parseVersionValue(event.target.value)))
                          }
                        >
                          {options.map((option) => (
                            <option key={versionValue(option.value)} value={versionValue(option.value)}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {/* With a logo, it is placed like on any photo mockup */}
                      {extraOpen && version !== 'none' ? (
                        photoSettings(template, settings, shown)
                      ) : (
                        <button type="button" className="palette-secondary-button" onClick={() => setEditing(template)}>
                          Edit template
                        </button>
                      )}
                      <div className="template-editor-row">
                        <button
                          type="button"
                          className="palette-secondary-button"
                          aria-label={`Move ${template.name} up`}
                          disabled={i === 0}
                          onClick={() => onChange(moveExtra(mockups, template.id, -1))}
                        >
                          Move up
                        </button>
                        <button
                          type="button"
                          className="palette-secondary-button"
                          aria-label={`Move ${template.name} down`}
                          disabled={i === extra.length - 1}
                          onClick={() => onChange(moveExtra(mockups, template.id, 1))}
                        >
                          Move down
                        </button>
                        <button
                          type="button"
                          className="palette-secondary-button"
                          aria-label={`Remove ${template.name}`}
                          onClick={() => onChange(removeExtra(mockups, template.id))}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ol>

              <div className="skin-color">
                <label htmlFor="mockup-extra-cols">Columns</label>
                <select
                  id="mockup-extra-cols"
                  value={layout.cols}
                  onChange={(event) => onChange(setExtraLayout(mockups, { cols: Number(event.target.value) }))}
                >
                  {range(EXTRA_LIMITS.cols).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="skin-color">
                <label htmlFor="mockup-extra-rows">Rows</label>
                <select
                  id="mockup-extra-rows"
                  value={layout.rows}
                  onChange={(event) => onChange(setExtraLayout(mockups, { rows: Number(event.target.value) }))}
                >
                  {range(EXTRA_LIMITS.rows).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="skin-control">
                <label htmlFor="mockup-extra-margin">Margin</label>
                <input
                  id="mockup-extra-margin"
                  type="range"
                  min={EXTRA_LIMITS.margin.min}
                  max={EXTRA_LIMITS.margin.max}
                  step={1}
                  value={layout.margin}
                  onChange={(event) => onChange(setExtraLayout(mockups, { margin: Number(event.target.value) }))}
                />
                <output htmlFor="mockup-extra-margin">{layout.margin}%</output>
              </div>
              <p className="logo-form-hint">1 × 1 gives each photo a page of its own.</p>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <TemplateEditor template={editing} logo={mockupLogo(logo, cover?.logo ?? null, null)} onSave={useTemplate} onClose={() => setEditing(null)} />
      )}
    </form>
  )
}
