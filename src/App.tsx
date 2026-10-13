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
import type { BrandFonts, CoverData, LogoData, Orientation, PaletteColor, PreviewView } from './types'
import './css/App.css'

function App() {
  // Kept here, above the routes, so they survive moving between pages.
  // `cover` is null until the Cover section is saved for the first time.
  const [cover, setCover] = useState<CoverData | null>(null)
  // `logo` is null until the Logo section is saved for the first time.
  const [logo, setLogo] = useState<LogoData | null>(null)
  // `palette` is null until the Colors section is saved for the first time.
  const [palette, setPalette] = useState<PaletteColor[] | null>(null)
  // `typography` is null until the Typography section is saved for the first time.
  const [typography, setTypography] = useState<BrandFonts | null>(null)
  const [orientation, setOrientation] = useState<Orientation>('portrait')
  const [previewView, setPreviewView] = useState<PreviewView>('grid')
  const [template, setTemplate] = useState<TemplateId>(DEFAULT_TEMPLATE)

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
                onSubmit={setCover}
                logo={logo}
                onLogoSubmit={setLogo}
                palette={palette}
                onPaletteSubmit={setPalette}
                typography={typography}
                onTypographySubmit={setTypography}
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
