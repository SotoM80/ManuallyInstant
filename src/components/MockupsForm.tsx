import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { MockupArt } from './pages/MockupArt'
import { PhotoMockup } from './pages/PhotoMockup'
import { SkinColorField } from './SkinColorField'
import { TemplateEditor } from './TemplateEditor'
import { MOCKUP_GROUPS } from '../mockups/products'
import { savePhotoTemplate, useMockupCatalog } from '../mockups/catalog'
import { ROTATION_LIMIT, SIZE_LIMITS, dragPlacement } from '../mockups/geometry'
import { areaGrid, clampOnGrid, logoOutline, surfaceSize } from '../mockups/warp'
import {
  DEFAULT_PLACEMENT,
  MAX_MOCKUPS,
  chosenVersion,
  mockupLogo,
  setMockupBlend,
  setMockupColor,
  setMockupPlacement,
  setMockupVersion,
  settingsFor,
  toggleMockup,
  versionOptions,
} from '../mockups/mockups'
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

// A photo the user can upload to make their own template (see specs/mockups.md)
const PHOTO_TYPES = ['image/jpeg', 'image/png']
const MAX_PHOTO_BYTES = 10 * 1024 * 1024

export function MockupsForm({ mockups, onChange, logo, cover, palette }: MockupsFormProps) {
  const catalog = useMockupCatalog()
  const [openId, setOpenId] = useState<string | null>(null) // null → every block folded
  const [editing, setEditing] = useState<PhotoTemplate | null>(null) // the template in the editor
  const [uploadError, setUploadError] = useState('')
  const uploads = useRef(0)

  // An uploaded photo opens the editor as a new template of this session
  function upload(file: File | undefined) {
    if (!file) return
    if (!PHOTO_TYPES.includes(file.type) || file.size > MAX_PHOTO_BYTES) {
      setUploadError('Use a JPG or PNG photo, up to 10 MB')
      return
    }
    setUploadError('')
    uploads.current += 1
    setEditing({
      kind: 'photo',
      id: `upload-${uploads.current}`,
      name: file.name.replace(/\.[^.]+$/, '') || 'My photo',
      group: 'apparel',
      image: URL.createObjectURL(file),
      size: [0, 0], // read by the editor
      mask: [],
      area: { x: 0, y: 0, width: 0, height: 0 }, // placed by the editor
      color: '#FFFFFF',
      colorLabel: 'Product color',
      tintable: true,
    })
  }

  // "Use now": the template joins the list for this session; a new one is ticked if there is room
  function useTemplate(template: PhotoTemplate) {
    const isNew = !catalog.some((item) => item.id === template.id)
    savePhotoTemplate(template)
    setEditing(null)
    if (isNew && !mockups.chosen.includes(template.id) && mockups.chosen.length < MAX_MOCKUPS) {
      onChange(toggleMockup(mockups, template.id))
      setOpenId(template.id)
    }
  }
  const full = mockups.chosen.length >= MAX_MOCKUPS
  const options = versionOptions(logo)

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
                    value={version === null ? 'primary' : String(version)}
                    onChange={(event) => {
                      const value = event.target.value
                      onChange(setMockupVersion(mockups, item.id, value === 'primary' ? null : Number(value)))
                    }}
                  >
                    {options.map((option) => (
                      <option key={option.value ?? 'primary'} value={option.value ?? 'primary'}>
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

      {editing && (
        <TemplateEditor template={editing} logo={mockupLogo(logo, cover?.logo ?? null, null)} onSave={useTemplate} onClose={() => setEditing(null)} />
      )}
    </form>
  )
}
