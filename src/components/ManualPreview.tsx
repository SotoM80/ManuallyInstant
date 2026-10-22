import { MANUAL_PAGES } from '../data/manualSections'
import { ManualPage } from './ManualPage'
import { TEMPLATES } from '../templates'
import type { TemplateId } from '../templates'
import { NO_SKIN } from '../skins/presets'
import type { Skin } from '../skins/types'
import { DEFAULT_MOCKUPS } from '../mockups/mockups'
import { NO_USAGE } from '../data/usageOptions'
import type { Mockups } from '../mockups/types'
import { useRef } from 'react'
import { withViewTransition } from '../utils/viewTransition'
import { useReorderGlide } from '../utils/useReorderGlide'
import type { Guides } from '../utils/guides'
import type { BrandFonts, CoverData, LogoData, Orientation, PaletteColor, PreviewView, UsageData } from '../types'
import '../css/ManualPreview.css'

type ManualPreviewProps = {
  cover: CoverData | null
  logo: LogoData | null
  usage?: UsageData // the examples of the Usage pages (see specs/usage.md)
  palette: PaletteColor[] | null
  typography: BrandFonts | null
  orientation: Orientation
  onOrientationChange: (orientation: Orientation) => void
  previewView: PreviewView
  onPreviewViewChange: (view: PreviewView) => void
  template: TemplateId
  onTemplateChange: (template: TemplateId) => void
  pages?: string[] // the order to draw the pages in (the open section's pages may come first)
  featured?: string[] // pages moved to the top, marked so the user sees what they are editing
  guides?: Guides // guides clicked on the construction grid of the Clear space page
  onGuidesChange?: (guides: Guides) => void
  skin?: Skin // the decorative layers behind every page (see specs/skins.md)
  mockups?: Mockups // the products of the Mockups page (see specs/mockups.md)
}

const ORIENTATIONS: { value: Orientation; label: string }[] = [
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
]

const VIEWS: { value: PreviewView; label: string }[] = [
  { value: 'grid', label: 'Grid' },
  { value: 'overview', label: 'Overview' },
  { value: 'pages', label: 'Pages' },
]

// Grid thumbnails are small, so the title is drawn at half its real size.
// In the Pages view each page is about twice as wide, so it uses the real size.
// Overview draws each page like a Grid thumbnail and shrinks it as a whole (see the CSS).
const TITLE_SCALE: Record<PreviewView, number> = { grid: 0.5, overview: 0.5, pages: 1 }

export function ManualPreview({
  cover,
  logo,
  usage = NO_USAGE,
  palette,
  typography,
  orientation,
  onOrientationChange,
  previewView,
  onPreviewViewChange,
  template,
  onTemplateChange,
  pages = MANUAL_PAGES,
  featured = [],
  guides,
  onGuidesChange,
  skin = NO_SKIN,
  mockups = DEFAULT_MOCKUPS,
}: ManualPreviewProps) {
  // When a section opens or folds, the pages glide to their new places
  const pageList = useRef<HTMLOListElement>(null)
  useReorderGlide(pageList, pages.join('|'))

  // data-template is set once here: every page of the manual uses the same template.
  return (
    <section
      className="manual-preview"
      aria-label="Manual preview"
      data-view={previewView}
      data-template={template}
    >
      <div className="preview-toolbar">
        <fieldset className="segmented-control">
          <legend>Page orientation</legend>
          {ORIENTATIONS.map((option) => (
            <label key={option.value}>
              <input
                type="radio"
                name="page-orientation"
                value={option.value}
                checked={orientation === option.value}
                onChange={() => withViewTransition(() => onOrientationChange(option.value))}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="segmented-control">
          <legend>Preview view</legend>
          {VIEWS.map((option) => (
            <label key={option.value}>
              <input
                type="radio"
                name="preview-view"
                value={option.value}
                checked={previewView === option.value}
                onChange={() => withViewTransition(() => onPreviewViewChange(option.value))}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="segmented-control">
          <legend>Template</legend>
          {TEMPLATES.map((option) => (
            <label key={option.id}>
              <input
                type="radio"
                name="template"
                value={option.id}
                checked={template === option.id}
                onChange={() => withViewTransition(() => onTemplateChange(option.id))}
              />
              <span>{option.name}</span>
            </label>
          ))}
        </fieldset>
      </div>

      <ol className="manual-pages" ref={pageList}>
        {pages.map((page) => (
          <li key={page} data-key={page} data-featured={featured.includes(page)}>
            <ManualPage
              page={page}
              orientation={orientation}
              titleScale={TITLE_SCALE[previewView]}
              cover={cover}
              logo={logo}
              usage={usage}
              palette={palette}
              typography={typography}
              skin={skin}
              mockups={mockups}
              guides={guides}
              onGuidesChange={onGuidesChange}
              transitionName
            />
            {/* Always the natural number, so a page moved to the top still reads "9. Typography" */}
            <span className="manual-page-name">
              {MANUAL_PAGES.indexOf(page) + 1}. {page}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
