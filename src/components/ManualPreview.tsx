import { MANUAL_PAGES } from '../data/manualSections'
import { toTitleCss } from '../data/titleOptions'
import type { Orientation, PreviewView, TitleStyle } from '../types'
import '../css/ManualPreview.css'

type ManualPreviewProps = {
  brandTitle: string
  titleStyle: TitleStyle
  orientation: Orientation
  onOrientationChange: (orientation: Orientation) => void
  previewView: PreviewView
  onPreviewViewChange: (view: PreviewView) => void
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
  brandTitle,
  titleStyle,
  orientation,
  onOrientationChange,
  previewView,
  onPreviewViewChange,
}: ManualPreviewProps) {
  const titleCss = toTitleCss(titleStyle)
  const pageTitleCss = {
    ...titleCss,
    fontSize: `${parseFloat(String(titleCss.fontSize)) * TITLE_SCALE[previewView]}px`,
  }

  function renderPage(page: string) {
    if (page !== 'Cover') return <p className="manual-page-empty">Coming soon</p>
    if (brandTitle === '') return <p className="manual-page-empty">Your brand title</p>
    return (
      <p className="manual-cover-title" style={pageTitleCss}>
        {brandTitle}
      </p>
    )
  }

  return (
    <section className="manual-preview" aria-label="Manual preview" data-view={previewView}>
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
      </div>

      <ol className="manual-pages">
        {MANUAL_PAGES.map((page, index) => (
          <li key={page}>
            <article className="manual-page" aria-label={page} data-orientation={orientation}>
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
