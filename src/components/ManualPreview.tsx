import { LOGO_PARTS, MANUAL_PAGES } from '../data/manualSections'
import { TEMPLATES } from '../templates'
import type { TemplateId } from '../templates'
import { CoverPage } from './pages/CoverPage'
import { BrandConceptPage } from './pages/BrandConceptPage'
import { AnatomyPage } from './pages/AnatomyPage'
import { LogoVersionsPage } from './pages/LogoVersionsPage'
import { ClearSpacePage } from './pages/ClearSpacePage'
import { ColorPalettePage } from './pages/ColorPalettePage'
import { TypographyPage } from './pages/TypographyPage'
import { DEFAULT_TYPOGRAPHY_COLOR } from '../data/colorPalette'
import { useRef } from 'react'
import { withViewTransition } from '../utils/viewTransition'
import { useReorderGlide } from '../utils/useReorderGlide'
import type { BrandFonts, CoverData, LogoData, Orientation, PaletteColor, PreviewView } from '../types'
import '../css/ManualPreview.css'

type ManualPreviewProps = {
  cover: CoverData | null
  logo: LogoData | null
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
}: ManualPreviewProps) {
  // When a section opens or folds, the pages glide to their new places
  const pageList = useRef<HTMLOListElement>(null)
  useReorderGlide(pageList, pages.join('|'))

  function renderPage(page: string) {
    const textColor = cover?.colors.typography ?? DEFAULT_TYPOGRAPHY_COLOR
    if (page === 'Brand concept')
      return <BrandConceptPage logo={logo} coverLogo={cover?.logo ?? null} color={textColor} />
    if (page === 'Anatomy') return <AnatomyPage logo={logo} color={textColor} />
    if (page === 'Logo versions' && LOGO_PARTS.versions)
      return <LogoVersionsPage logo={logo} coverLogo={cover?.logo ?? null} color={textColor} />
    if (page === 'Clear space' && LOGO_PARTS.clearSpace)
      return <ClearSpacePage logo={logo} coverLogo={cover?.logo ?? null} color={textColor} />
    if (page === 'Color palette') return <ColorPalettePage palette={palette} color={textColor} />
    if (page === 'Typography') return <TypographyPage fonts={typography} color={textColor} />
    if (page !== 'Cover') return <p className="manual-page-empty">Coming soon</p>
    // A new key on every applied logo (each one has its own URL) redraws the cover, so it grows in again
    return (
      <CoverPage
        key={cover?.logo?.url ?? 'empty'}
        cover={cover}
        titleScale={TITLE_SCALE[previewView]}
      />
    )
  }

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
            <article
              className="manual-page"
              aria-label={page}
              data-orientation={orientation}
              style={{
                // Named after the page, not its place, so each page keeps its own name when the order changes
                viewTransitionName: `manual-page-${page.toLowerCase().replace(/ /g, '-')}`,
                background: cover?.colors.background,
              }}
            >
              <div className="manual-page-content">{renderPage(page)}</div>
            </article>
            {/* Always the natural number, so a page moved to the top still reads "7. Typography" */}
            <span className="manual-page-name">
              {MANUAL_PAGES.indexOf(page) + 1}. {page}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
