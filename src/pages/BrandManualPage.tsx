import { useMemo, useRef, useState } from 'react'
import type { ReactNode, SyntheticEvent } from 'react'
import { BrandForm } from '../components/BrandForm'
import { LogoForm } from '../components/LogoForm'
import { ColorsForm } from '../components/ColorsForm'
import { TypographyForm } from '../components/TypographyForm'
import { SkinForm } from '../components/SkinForm'
import { UsageForm } from '../components/UsageForm'
import { ExportButtons } from '../components/ExportButtons'
import { CmykProvider } from '../components/CmykProvider'
import { NO_SKIN } from '../skins/presets'
import { ManualPreview } from '../components/ManualPreview'
import { MANUAL_SECTIONS, SECTION_AREAS, SECTION_PAGES, orderPages } from '../data/manualSections'
import { NO_USAGE } from '../data/usageOptions'
import { useAlignOpenSection } from '../utils/useAlignOpenSection'
import { NO_GUIDES } from '../utils/guides'
import type { Guides } from '../utils/guides'
import { useReorderGlide } from '../utils/useReorderGlide'
import type { TemplateId } from '../templates'
import type { Skin } from '../skins/types'
import { MockupsForm } from '../components/MockupsForm'
import { DEFAULT_MOCKUPS } from '../mockups/mockups'
import type { Mockups } from '../mockups/types'
import type { BrandFonts, CoverData, LogoData, Orientation, PaletteColor, PreviewView, UsageData } from '../types'
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
  usage?: UsageData
  onUsageChange?: (usage: UsageData) => void
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
  usage = NO_USAGE,
  onUsageChange = () => {},
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
  // In a section with areas (Logo, Usage), the area being worked in decides which of its pages is
  // the main one; each section starts on its first area every time it opens
  const [area, setArea] = useState('')
  const sectionPages = openSection ? SECTION_PAGES[openSection] : []
  const areas = openSection ? SECTION_AREAS[openSection] : undefined
  const mainPage = areas ? areas.pages[area] ?? areas.pages[areas.first] : sectionPages[0]
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

  // Clicking in an area of the Logo or Usage form (or reaching it with Tab) makes its page the
  // main one. Scrolling does not: moving through the form and the preview at once fought each other.
  function handleArea(event: SyntheticEvent<HTMLElement>) {
    const clicked = (event.target as Element).closest('[data-area]')?.getAttribute('data-area')
    if (clicked) setArea(clicked)
  }

  function toggleSection(id: string) {
    const opening = openSection !== id
    setOpenSection(opening ? id : null)
    setArea('')
    // The section and its page are now at the top: bring the top into view if it is above it
    const top = sectionList.current?.getBoundingClientRect().top ?? 0
    if (opening && top < 0) window.scrollBy({ top: top - 16, behavior: 'smooth' })
  }

  // The palette's colors, for their CMYK values from the server (specs/colorpalette.md)
  const paletteHexes = useMemo(() => (palette ?? []).map((color) => color.hex), [palette])

  // Form of each built section. Sections not listed here show "Coming soon".
  // The forms send every change to the preview at once; a new image waits for the Apply next
  // to its field (see docs/adr/0007 and 0020).
  const sectionForms: Record<string, ReactNode> = {
    cover: <BrandForm onChange={onCoverChange} />,
    logo: <LogoForm onChange={onLogoChange} palette={palette} />,
    usage: <UsageForm onChange={onUsageChange} palette={palette} />,
    colors: <ColorsForm onChange={onPaletteChange} />,
    typography: <TypographyForm onChange={onTypographyChange} />,
    skin: (
      <SkinForm skin={skin} onChange={onSkinChange} palette={palette} />
    ),
    mockups: (
      <MockupsForm mockups={mockups} onChange={onMockupsChange} logo={logo} cover={cover} palette={palette} />
    ),
  }

  // The form, the preview, full screen and the export share the profile values (specs/colorpalette.md)
  return (
    <CmykProvider hexes={paletteHexes}>
      <div className="brand-manual-page" ref={pageRoot}>
        <ManualPreview
          cover={cover}
          logo={logo}
          usage={usage}
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
              usage={usage}
              palette={palette}
              typography={typography}
              skin={skin}
              mockups={mockups}
              orientation={orientation}
              template={template}
              guides={guides}
            />
          </div>

          <ol ref={sectionList}>
            {sections.map((section) => {
              // Always the natural number, so a section moved to the top still reads "5. Typography"
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
                        onClick={SECTION_AREAS[section.id] ? handleArea : undefined}
                        onFocus={SECTION_AREAS[section.id] ? handleArea : undefined}
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
    </CmykProvider>
  )
}
