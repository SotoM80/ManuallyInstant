import { MANUAL_PAGES } from '../data/manualSections'
import { toTitleCss } from '../data/titleOptions'
import type { Orientation, TitleStyle } from '../types'
import '../css/ManualPreview.css'

type ManualPreviewProps = {
  brandTitle: string
  titleStyle: TitleStyle
  orientation: Orientation
  onOrientationChange: (orientation: Orientation) => void
}

const ORIENTATIONS: { value: Orientation; label: string }[] = [
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
]

// Thumbnails are small, so the title is drawn at half its real size.
const THUMBNAIL_SCALE = 0.5

export function ManualPreview({
  brandTitle,
  titleStyle,
  orientation,
  onOrientationChange,
}: ManualPreviewProps) {
  const titleCss = toTitleCss(titleStyle)
  const thumbnailTitleCss = {
    ...titleCss,
    fontSize: `${parseFloat(String(titleCss.fontSize)) * THUMBNAIL_SCALE}px`,
  }

  function renderPage(page: string) {
    if (page !== 'Cover') return <p className="manual-page-empty">Coming soon</p>
    if (brandTitle === '') return <p className="manual-page-empty">Your brand title</p>
    return (
      <p className="manual-cover-title" style={thumbnailTitleCss}>
        {brandTitle}
      </p>
    )
  }

  return (
    <section className="manual-preview" aria-label="Manual preview">
      <fieldset className="orientation-picker">
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
