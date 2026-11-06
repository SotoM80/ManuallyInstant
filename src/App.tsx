import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { Logo } from './components/Logo'
import { NavMenu } from './components/NavMenu'
import { HomePage } from './pages/HomePage'
import { BrandManualPage } from './pages/BrandManualPage'
import type { DraftKey, Drafts } from './utils/drafts'
import type { TypographyDraft } from './components/TypographyForm'
import type { ColorsDraft } from './components/ColorsForm'
import type { UsageDraft } from './components/UsageForm'
import type { LogoDraft } from './components/LogoForm'
import { NO_GUIDES } from './utils/guides'
import type { Guides } from './utils/guides'
import { DEFAULT_TITLE_STYLE } from './data/titleOptions'
import { loadGoogleFont } from './utils/googleFonts'
import { DEFAULT_TEMPLATE } from './templates'
import type { TemplateId } from './templates'
import { NO_SKIN } from './skins/presets'
import type { Skin } from './skins/types'
import { DEFAULT_MOCKUPS } from './mockups/mockups'
import type { Mockups } from './mockups/types'
import { loadLocalTemplates } from './mockups/catalog'
import { NO_USAGE } from './data/usageOptions'
import type { BrandFonts, CoverData, LogoData, Orientation, PaletteColor, PreviewView, UsageData } from './types'
import './css/App.css'

function App() {
  // Kept here, above the routes, so they survive moving between pages.
  // Each one is null until its section is touched for the first time; from then on the
  // forms send every change here, so the preview follows them live.
  const [cover, setCover] = useState<CoverData | null>(null)
  // What each form shows (half-typed values too), so it is filled again on the way back.
  const [drafts, setDrafts] = useState<Drafts>({})
  // Always from the newest drafts, so two forms changing close together never undo each other.
  const onDraftChange = useCallback(<K extends DraftKey>(key: K, draft: Drafts[K]) => {
    setDrafts((prev) => ({ ...prev, [key]: draft }))
  }, [])
  const [logo, setLogo] = useState<LogoData | null>(null)
  const [logoDraft, setLogoDraft] = useState<LogoDraft>()
  const [usage, setUsage] = useState<UsageData>(NO_USAGE) // each group null until touched
  const [usageDraft, setUsageDraft] = useState<UsageDraft>()
  const [palette, setPalette] = useState<PaletteColor[] | null>(null)
  const [colorsDraft, setColorsDraft] = useState<ColorsDraft>()
  const [typography, setTypography] = useState<BrandFonts | null>(null)
  const [typographyDraft, setTypographyDraft] = useState<TypographyDraft>()
  const [orientation, setOrientation] = useState<Orientation>('portrait')
  const [previewView, setPreviewView] = useState<PreviewView>('grid')
  const [template, setTemplate] = useState<TemplateId>(DEFAULT_TEMPLATE)
  const [skin, setSkin] = useState<Skin>(NO_SKIN)
  const [mockups, setMockups] = useState<Mockups>(DEFAULT_MOCKUPS)
  const [guides, setGuides] = useState<Guides>(NO_GUIDES) // clicked on the construction grid

  // Photo templates for local tests only, if the file is there (see public/mockups/LICENSES.md)
  useEffect(() => {
    loadLocalTemplates()
  }, [])

  const fontFamily = cover?.style.fontFamily ?? DEFAULT_TITLE_STYLE.fontFamily
  useEffect(() => {
    loadGoogleFont(fontFamily)
  }, [fontFamily])

  // The brand fonts are only drawn in regular (see specs/typography.md)
  useEffect(() => {
    if (!typography) return
    loadGoogleFont(typography.primary, 'regular')
    loadGoogleFont(typography.secondary, 'regular')
  }, [typography])

  return (
    <>
      <header className="preview-header">
        <Logo />
        <NavMenu />
      </header>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/brand-manual"
            element={
              <BrandManualPage
                cover={cover}
                orientation={orientation}
                onOrientationChange={setOrientation}
                previewView={previewView}
                onPreviewViewChange={setPreviewView}
                template={template}
                onTemplateChange={setTemplate}
                onCoverChange={setCover}
                drafts={drafts}
                onDraftChange={onDraftChange}
                guides={guides}
                onGuidesChange={setGuides}
                logo={logo}
                onLogoChange={setLogo}
                logoDraft={logoDraft}
                onLogoDraftChange={setLogoDraft}
                usage={usage}
                onUsageChange={setUsage}
                usageDraft={usageDraft}
                onUsageDraftChange={setUsageDraft}
                palette={palette}
                onPaletteChange={setPalette}
                colorsDraft={colorsDraft}
                onColorsDraftChange={setColorsDraft}
                typography={typography}
                onTypographyChange={setTypography}
                typographyDraft={typographyDraft}
                onTypographyDraftChange={setTypographyDraft}
                skin={skin}
                mockups={mockups}
                onMockupsChange={setMockups}
                onSkinChange={setSkin}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}

export default App
