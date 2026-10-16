import { LOGO_PARTS } from '../data/manualSections'
import { CoverPage } from './pages/CoverPage'
import { BrandConceptPage } from './pages/BrandConceptPage'
import { AnatomyPage } from './pages/AnatomyPage'
import { LogoVersionsPage } from './pages/LogoVersionsPage'
import { ClearSpacePage } from './pages/ClearSpacePage'
import { ColorPalettePage } from './pages/ColorPalettePage'
import { TypographyPage } from './pages/TypographyPage'
import { MockupsPage } from './pages/MockupsPage'
import { SkinBackdrop } from './pages/SkinBackdrop'
import type { ExportKind } from '../export/exportSettings'
import type { Skin } from '../skins/types'
import type { Mockups } from '../mockups/types'
import type { Guides } from '../utils/guides'
import type { BrandFonts, CoverData, LogoData, Orientation, PaletteColor } from '../types'

// Everything the pages of the manual are made of
export type ManualData = {
  cover: CoverData | null
  logo: LogoData | null
  palette: PaletteColor[] | null
  typography: BrandFonts | null
  skin: Skin
  mockups: Mockups
}

type ManualPageProps = ManualData & {
  page: string
  orientation: Orientation
  titleScale: number // the Cover title's size, as a share of its real size
  guides?: Guides
  onGuidesChange?: (guides: Guides) => void // given → the guide bands of 3.2 can be clicked
  emphasis?: ExportKind // the values the Color palette page highlights in a PDF
  transitionName?: boolean // the preview's pages glide between layouts (ADR 0006); a copy must not
}

// One page of the manual: its background, its skin and its content. The preview and the
// PDF export draw the same component, so the PDF shows what the preview shows.
export function ManualPage({
  page,
  orientation,
  titleScale,
  cover,
  logo,
  palette,
  typography,
  skin,
  mockups,
  guides,
  onGuidesChange,
  emphasis,
  transitionName = false,
}: ManualPageProps) {
  // The Cover keeps its own colors; every other page takes them from the Skin, and the Cover
  // only draws the layers marked "Also on the Cover" (see specs/skins.md and ADR 0011)
  const isCover = page === 'Cover'
  const layers = isCover ? skin.layers.filter((layer) => layer.onCover) : skin.layers

  function content() {
    const textColor = skin.pageText
    if (page === 'Brand concept')
      return <BrandConceptPage logo={logo} coverLogo={cover?.logo ?? null} color={textColor} />
    if (page === 'Anatomy') return <AnatomyPage logo={logo} color={textColor} />
    if (page === 'Logo versions' && LOGO_PARTS.versions)
      return <LogoVersionsPage logo={logo} coverLogo={cover?.logo ?? null} color={textColor} />
    if (page === 'Clear space' && LOGO_PARTS.clearSpace)
      return (
        <ClearSpacePage
          logo={logo}
          coverLogo={cover?.logo ?? null}
          color={textColor}
          guides={guides}
          onGuidesChange={onGuidesChange}
        />
      )
    if (page === 'Color palette') return <ColorPalettePage palette={palette} color={textColor} emphasis={emphasis} />
    if (page === 'Typography') return <TypographyPage fonts={typography} color={textColor} />
    if (page === 'Mockups') return <MockupsPage mockups={mockups} logo={logo} cover={cover} color={textColor} />
    if (!isCover) return <p className="manual-page-empty">Coming soon</p>
    // A new key on every applied logo (each one has its own URL) redraws the cover, so it grows in again
    return <CoverPage key={cover?.logo?.url ?? 'empty'} cover={cover} titleScale={titleScale} />
  }

  return (
    <article
      className="manual-page"
      aria-label={page}
      data-orientation={orientation}
      style={{
        // Named after the page, not its place, so each page keeps its own name when the order changes
        viewTransitionName: transitionName ? `manual-page-${page.toLowerCase().replace(/ /g, '-')}` : undefined,
        background: isCover ? cover?.colors.background : skin.pageBackground,
      }}
    >
      <SkinBackdrop layers={layers} orientation={orientation} />
      <div className="manual-page-content">{content()}</div>
    </article>
  )
}
