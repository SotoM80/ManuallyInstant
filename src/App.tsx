import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { Logo } from './components/Logo'
import { NavMenu } from './components/NavMenu'
import { HomePage } from './pages/HomePage'
import { BrandManualPage } from './pages/BrandManualPage'
import { DEFAULT_TITLE_STYLE } from './data/titleOptions'
import { loadGoogleFont } from './utils/googleFonts'
import type { Orientation, PreviewView, TitleStyle } from './types'
import './css/App.css'

function App() {
  // Kept here, above the routes, so they survive moving between pages.
  const [brandTitle, setBrandTitle] = useState('')
  const [titleStyle, setTitleStyle] = useState<TitleStyle>(DEFAULT_TITLE_STYLE)
  const [orientation, setOrientation] = useState<Orientation>('portrait')
  const [previewView, setPreviewView] = useState<PreviewView>('grid')

  useEffect(() => {
    loadGoogleFont(titleStyle.fontFamily)
  }, [titleStyle.fontFamily])

  function handleSubmit(title: string, style: TitleStyle) {
    setBrandTitle(title)
    setTitleStyle(style)
  }

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
                brandTitle={brandTitle}
                titleStyle={titleStyle}
                orientation={orientation}
                onOrientationChange={setOrientation}
                previewView={previewView}
                onPreviewViewChange={setPreviewView}
                onSubmit={handleSubmit}
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
