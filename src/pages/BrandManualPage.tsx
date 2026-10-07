import type { ReactNode } from 'react'
import { BrandForm } from '../components/BrandForm'
import { ManualPreview } from '../components/ManualPreview'
import { MANUAL_SECTIONS } from '../data/manualSections'
import type { Orientation, TitleStyle } from '../types'
import '../css/BrandManualPage.css'

type BrandManualPageProps = {
  brandTitle: string
  titleStyle: TitleStyle
  orientation: Orientation
  onOrientationChange: (orientation: Orientation) => void
  onSubmit: (title: string, style: TitleStyle) => void
}

export function BrandManualPage({
  brandTitle,
  titleStyle,
  orientation,
  onOrientationChange,
  onSubmit,
}: BrandManualPageProps) {
  // Form of each built section. Sections not listed here show "Coming soon".
  const sectionForms: Record<string, ReactNode> = {
    'brand-title': <BrandForm onSubmit={onSubmit} />,
  }

  return (
    <div className="brand-manual-page">
      <ManualPreview
        brandTitle={brandTitle}
        titleStyle={titleStyle}
        orientation={orientation}
        onOrientationChange={onOrientationChange}
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
