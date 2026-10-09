import { MANUAL_PAGES } from '../data/manualSections'
import { TEMPLATES } from '../templates'
import type { TemplateId } from '../templates'
import { CoverPage } from './pages/CoverPage'
import type { CoverData, Orientation, PreviewView } from '../types'
import '../css/ManualPreview.css'

type ManualPreviewProps = {
  cover: CoverData | null
  orientation: Orientation
  onOrientationChange: (orientation: Orientation) => void
  previewView: PreviewView
  onPreviewViewChange: (view: PreviewView) => void
  template: TemplateId
  onTemplateChange: (template: TemplateId) => void
}

const ORIENTATIONS: { value: Orientation; label: string }[] = [
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
]

const VIEWS: { value: PreviewView; label: string }[] = [
  { value: 'grid', label: 'Grid' },
  { value: 'pages', label: 'Pages' },
]

// Grid thumbnails are small, so the title is drawn at half its real size.
// In the Pages view each page is about twice as wide, so it uses the real size.
const TITLE_SCALE: Record<PreviewView, number> = { grid: 0.5, pages: 1 }

export function ManualPreview({
  cover,
  orientation,
  onOrientationChange,
  previewView,
  onPreviewViewChange,
  template,
  onTemplateChange,
}: ManualPreviewProps) {
  function renderPage(page: string) {
    if (page !== 'Cover') return <p className="manual-page-empty">Coming soon</p>
    return <CoverPage cover={cover} titleScale={TITLE_SCALE[previewView]} />
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
                onChange={() => onOrientationChange(option.value)}
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
                onChange={() => onPreviewViewChange(option.value)}
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
                onChange={() => onTemplateChange(option.id)}
              />
              <span>{option.name}</span>
            </label>
          ))}
        </fieldset>
      </div>

      <ol className="manual-pages">
        {MANUAL_PAGES.map((page, index) => (
          <li key={page}>
            <article
              className="manual-page"
              aria-label={page}
              data-orientation={orientation}
              style={cover ? { background: cover.colors.background } : undefined}
            >
              <div className="manual-page-content">{renderPage(page)}</div>
            </article>
            <span className="manual-page-name">
              {index + 1}. {page}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
