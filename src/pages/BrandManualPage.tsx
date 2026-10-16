import { useCallback, useRef, useState } from 'react'
import type { AnimationEvent, ReactNode, SyntheticEvent } from 'react'
import { BrandForm } from '../components/BrandForm'
import { LogoForm } from '../components/LogoForm'
import { ColorsForm } from '../components/ColorsForm'
import { TypographyForm } from '../components/TypographyForm'
import { SkinForm } from '../components/SkinForm'
import { ExportButtons } from '../components/ExportButtons'
import { NO_SKIN } from '../skins/presets'
import { ManualPreview } from '../components/ManualPreview'
import { LOGO_AREA_PAGES, MANUAL_SECTIONS, SECTION_PAGES, orderPages } from '../data/manualSections'
import { useAlignOpenSection } from '../utils/useAlignOpenSection'
import { NO_GUIDES } from '../utils/guides'
import type { Guides } from '../utils/guides'
import { useReorderGlide } from '../utils/useReorderGlide'
import type { TemplateId } from '../templates'
import type { Skin } from '../skins/types'
import { MockupsForm } from '../components/MockupsForm'
import { DEFAULT_MOCKUPS } from '../mockups/mockups'
import type { Mockups } from '../mockups/types'
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
  onCoverChange: (cover: CoverData) => void
  logo: LogoData | null
  onLogoChange: (logo: LogoData) => void
  palette: PaletteColor[] | null
  onPaletteChange: (palette: PaletteColor[]) => void
  typography: BrandFonts | null
  onTypographyChange: (fonts: BrandFonts) => void
  skin?: Skin
  onSkinChange?: (skin: Skin) => void
  mockups?: Mockups
  onMockupsChange?: (mockups: Mockups) => void
}

export function BrandManualPage({
  cover,
  orientation,
  onOrientationChange,
  previewView,
  onPreviewViewChange,
  template,
  onTemplateChange,
  onCoverChange,
  logo,
  onLogoChange,
  palette,
  onPaletteChange,
  typography,
  onTypographyChange,
  skin = NO_SKIN,
  mockups = DEFAULT_MOCKUPS,
  onMockupsChange = () => {},
  onSkinChange = () => {},
}: BrandManualPageProps) {
  // The sections work like an accordion: only one is open, the others fold into their header.
  // Folded forms stay in the page (inert), so nothing typed in them is lost.
  const [openSection, setOpenSection] = useState<string | null>('cover')
  // Guides clicked on the construction grid (Clear space page). They are drawn in the preview,
  // so they live here rather than in the Logo form.
  const [guides, setGuides] = useState<Guides>(NO_GUIDES)
  // The open section's pages come first in the preview, so the page being edited is always
  // in view; folding the section puts every page back in its natural order.
  // In the Logo section, the area being worked in decides which of its four pages is the main one
  const [logoArea, setLogoArea] = useState('concept')
  const sectionPages = openSection ? SECTION_PAGES[openSection] : []
  const mainPage = openSection === 'logo' ? LOGO_AREA_PAGES[logoArea] : sectionPages[0]
  const featured = mainPage ? [mainPage, ...sectionPages.filter((page) => page !== mainPage)] : []
  // The open section also moves to the top of its column, at the height of its page, so
  // the form and its page sit side by side. Folding it puts every section back in order.
  const sections = openSection
    ? [
        ...MANUAL_SECTIONS.filter((section) => section.id === openSection),
        ...MANUAL_SECTIONS.filter((section) => section.id !== openSection),
      ]
    : MANUAL_SECTIONS
  const pageRoot = useRef<HTMLDivElement>(null)
  const sectionList = useRef<HTMLOListElement>(null)
  useAlignOpenSection(pageRoot, openSection !== null)
  useReorderGlide(sectionList, sections.map((section) => section.id).join('|'))

  // Clicking in an area of the Logo form (or reaching it with Tab) makes its page the main
  // one. Scrolling does not: moving through the form and the preview at once fought each other.
  function handleLogoArea(event: SyntheticEvent<HTMLElement>) {
    const area = (event.target as Element).closest('[data-area]')?.getAttribute('data-area')
    if (area) setLogoArea(area)
  }

  function toggleSection(id: string) {
    const opening = openSection !== id
    setOpenSection(opening ? id : null)
    // The section and its page are now at the top: bring the top into view if it is above it
    const top = sectionList.current?.getBoundingClientRect().top ?? 0
    if (opening && top < 0) window.scrollBy({ top: top - 16, behavior: 'smooth' })
  }

  // The forms send every change to the preview at once, but a new image waits for the
  // Apply button of the preview (see docs/adr/0007). Each Apply adds one to `applyCount`,
  // and the forms show every image chosen before it.
  const [applyCount, setApplyCount] = useState(0)
  const [coverPending, setCoverPending] = useState(false)
  const [logoPending, setLogoPending] = useState(false)
  const applyImages = useCallback(() => setApplyCount((count) => count + 1), [])
  // A pulse with a check after Apply, like the Save buttons had (see specs/motion.md)
  const [applied, setApplied] = useState(false)
  const canApply = coverPending || logoPending

  function handleApply() {
    applyImages()
    setApplied(true)
  }

  // Back to idle when the button's own animation ends; the check (::after) has its own.
  function handleAppliedEnd(event: AnimationEvent<HTMLButtonElement>) {
    if (!event.pseudoElement) setApplied(false)
  }

  // Form of each built section. Sections not listed here show "Coming soon".
  const sectionForms: Record<string, ReactNode> = {
    cover: (
      <BrandForm onChange={onCoverChange} applyCount={applyCount} onPendingChange={setCoverPending} />
    ),
    logo: <LogoForm onChange={onLogoChange} applyCount={applyCount} onPendingChange={setLogoPending} />,
    colors: <ColorsForm onChange={onPaletteChange} />,
    typography: <TypographyForm onChange={onTypographyChange} />,
    skin: (
      <SkinForm skin={skin} onChange={onSkinChange} palette={palette} />
    ),
    mockups: (
      <MockupsForm mockups={mockups} onChange={onMockupsChange} logo={logo} cover={cover} palette={palette} />
    ),
  }

  return (
    <div className="brand-manual-page" ref={pageRoot}>
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
        pages={orderPages(featured)}
        featured={mainPage ? [mainPage] : []}
        guides={guides}
        onGuidesChange={setGuides}
        skin={skin}
        mockups={mockups}
      />

      <section className="manual-sections" aria-label="Manual sections">
        <div className="sections-actions">
          {/* The whole manual as a PDF, for print or for the web (see specs/export.md) */}
          <ExportButtons
            cover={cover}
            logo={logo}
            palette={palette}
            typography={typography}
            skin={skin}
            mockups={mockups}
            orientation={orientation}
            template={template}
            guides={guides}
          />
          {/* Text and colors show at once; a new image waits here (see docs/adr/0007) */}
          <button
            type="button"
            className="sections-apply"
            disabled={!canApply}
            onClick={handleApply}
            data-feedback={applied ? 'saved' : 'idle'}
            onAnimationEnd={handleAppliedEnd}
            title={canApply ? 'Show the new image in the manual' : 'Choose a new image to apply it'}
          >
            Apply
          </button>
        </div>

        <ol ref={sectionList}>
          {sections.map((section) => {
            // Always the natural number, so a section moved to the top still reads "4. Typography"
            const number = MANUAL_SECTIONS.indexOf(section) + 1
            const isOpen = section.ready && openSection === section.id
            const bodyId = `manual-section-${section.id}`
            return (
              <li
                key={section.id}
                className="manual-section"
                data-key={section.id}
                data-section={section.id}
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
                        onClick={() => toggleSection(section.id)}
                      >
                        {number}. {section.label}
                        <span className="manual-section-chevron" aria-hidden="true" />
                      </button>
                    ) : (
                      <>
                        {number}. {section.label}
                      </>
                    )}
                  </h2>
                  {!section.ready && <span className="manual-section-badge">Coming soon</span>}
                </div>
                {section.ready && (
                  <div id={bodyId} className="manual-section-body" inert={!isOpen}>
                    <div
                      className="manual-section-inner"
                      onClick={section.id === 'logo' ? handleLogoArea : undefined}
                      onFocus={section.id === 'logo' ? handleLogoArea : undefined}
                    >
                      {sectionForms[section.id]}
                    </div>
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
