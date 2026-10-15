import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { Logo } from './components/Logo'
import { NavMenu } from './components/NavMenu'
import { HomePage } from './pages/HomePage'
import { BrandManualPage } from './pages/BrandManualPage'
import { DEFAULT_TITLE_STYLE } from './data/titleOptions'
import { loadGoogleFont } from './utils/googleFonts'
import { DEFAULT_TEMPLATE } from './templates'
import type { TemplateId } from './templates'
import { skinFor } from './skins/presets'
import type { Skin } from './skins/types'
import type { BrandFonts, CoverData, LogoData, Orientation, PaletteColor, PreviewView } from './types'
import './css/App.css'

function App() {
  // Kept here, above the routes, so they survive moving between pages.
  // Each one is null until its section is touched for the first time; from then on the
  // forms send every change here, so the preview follows them live.
  const [cover, setCover] = useState<CoverData | null>(null)
  const [logo, setLogo] = useState<LogoData | null>(null)
  const [palette, setPalette] = useState<PaletteColor[] | null>(null)
  const [typography, setTypography] = useState<BrandFonts | null>(null)
  const [orientation, setOrientation] = useState<Orientation>('portrait')
  const [previewView, setPreviewView] = useState<PreviewView>('grid')
  const [template, setTemplate] = useState<TemplateId>(DEFAULT_TEMPLATE)
  // Turned on by hand with Linear until the Skin section exists (specs/skins.md, Build Order).
  // To turn it off, use NO_SKIN from './skins/presets'.
  const [skin] = useState<Skin>(() => skinFor('linear', [0, 1]))

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
                logo={logo}
                onLogoChange={setLogo}
                palette={palette}
                onPaletteChange={setPalette}
                typography={typography}
                onTypographyChange={setTypography}
                skin={skin}
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
