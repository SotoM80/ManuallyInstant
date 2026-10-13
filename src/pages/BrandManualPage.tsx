import { useState } from 'react'
import type { ReactNode } from 'react'
import { BrandForm } from '../components/BrandForm'
import { LogoForm } from '../components/LogoForm'
import { ColorsForm } from '../components/ColorsForm'
import { TypographyForm } from '../components/TypographyForm'
import { ManualPreview } from '../components/ManualPreview'
import { MANUAL_SECTIONS } from '../data/manualSections'
import { keepInPlace } from '../utils/scrollAnchor'
import type { TemplateId } from '../templates'
import type { BrandFonts, CoverData, LogoData, Orientation, PaletteColor, PreviewView } from '../types'
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
  logo: LogoData | null
  onLogoSubmit: (logo: LogoData) => void
  palette: PaletteColor[] | null
  onPaletteSubmit: (palette: PaletteColor[]) => void
  typography: BrandFonts | null
  onTypographySubmit: (fonts: BrandFonts) => void
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
  logo,
  onLogoSubmit,
  palette,
  onPaletteSubmit,
  typography,
  onTypographySubmit,
}: BrandManualPageProps) {
  // The sections work like an accordion: only one is open, the others fold into their header.
  // Folded forms stay in the page (inert), so nothing typed in them is lost.
  const [openSection, setOpenSection] = useState<string | null>('cover')

  function toggleSection(id: string) {
    setOpenSection((prev) => (prev === id ? null : id))
  }

  // Form of each built section. Sections not listed here show "Coming soon".
  const sectionForms: Record<string, ReactNode> = {
    cover: <BrandForm onSubmit={onSubmit} />,
    logo: <LogoForm onSubmit={onLogoSubmit} />,
    colors: <ColorsForm onSubmit={onPaletteSubmit} />,
    typography: <TypographyForm onSubmit={onTypographySubmit} />,
  }

  return (
    <div className="brand-manual-page">
      <ManualPreview
        cover={cover}
        logo={logo}
        palette={palette}
        typography={typography}
        orientation={orientation}
        onOrientationChange={onOrientationChange}
        previewView={previewView}
        onPreviewViewChange={onPreviewViewChange}
        template={template}
        onTemplateChange={onTemplateChange}
      />

      <section className="manual-sections" aria-label="Manual sections">
        <ol>
          {MANUAL_SECTIONS.map((section, index) => {
            const isOpen = section.ready && openSection === section.id
            const bodyId = `manual-section-${section.id}`
            return (
              <li
                key={section.id}
                className="manual-section"
                aria-disabled={section.ready ? undefined : 'true'}
                data-open={isOpen}
              >
                <div className="manual-section-header">
                  <h2>
                    {section.ready ? (
                      <button
                        type="button"
                        className="manual-section-toggle"
                        aria-expanded={isOpen}
                        aria-controls={bodyId}
                        onClick={(event) => {
                          keepInPlace(event.currentTarget) // the section above may fold
                          toggleSection(section.id)
                        }}
                      >
                        {index + 1}. {section.label}
                        <span className="manual-section-chevron" aria-hidden="true" />
                      </button>
                    ) : (
                      <>
                        {index + 1}. {section.label}
                      </>
                    )}
                  </h2>
                  {!section.ready && <span className="manual-section-badge">Coming soon</span>}
                </div>
                {section.ready && (
                  <div id={bodyId} className="manual-section-body" inert={!isOpen}>
                    <div className="manual-section-inner">{sectionForms[section.id]}</div>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
