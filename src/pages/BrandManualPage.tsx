import type { ReactNode } from 'react'
import { BrandForm } from '../components/BrandForm'
import { ManualPreview } from '../components/ManualPreview'
import { MANUAL_SECTIONS } from '../data/manualSections'
import type { TemplateId } from '../templates'
import type { CoverData, Orientation, PreviewView } from '../types'
import '../css/BrandManualPage.css'

type BrandManualPageProps = {
  cover: CoverData | null
  orientation: Orientation
  onOrientationChange: (orientation: Orientation) => void
  previewView: PreviewView
  onPreviewViewChange: (view: PreviewView) => void
  template: TemplateId
  onTemplateChange: (template: TemplateId) => void
  onSubmit: (cover: CoverData) => void
}

export function BrandManualPage({
  cover,
  orientation,
  onOrientationChange,
  previewView,
  onPreviewViewChange,
  template,
  onTemplateChange,
  onSubmit,
}: BrandManualPageProps) {
  // Form of each built section. Sections not listed here show "Coming soon".
  const sectionForms: Record<string, ReactNode> = {
    cover: <BrandForm onSubmit={onSubmit} />,
  }

  return (
    <div className="brand-manual-page">
      <ManualPreview
        cover={cover}
        orientation={orientation}
        onOrientationChange={onOrientationChange}
        previewView={previewView}
        onPreviewViewChange={onPreviewViewChange}
        template={template}
        onTemplateChange={onTemplateChange}
      />

      <section className="manual-sections" aria-label="Manual sections">
        <ol>
          {MANUAL_SECTIONS.map((section, index) => (
            <li
              key={section.id}
              className="manual-section"
              aria-disabled={section.ready ? undefined : 'true'}
            >
              <div className="manual-section-header">
                <h2>
                  {index + 1}. {section.label}
                </h2>
                {!section.ready && <span className="manual-section-badge">Coming soon</span>}
              </div>
              {section.ready && sectionForms[section.id]}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
