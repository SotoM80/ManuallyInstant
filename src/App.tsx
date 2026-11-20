import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { Logo } from './components/Logo'
import { NavMenu } from './components/NavMenu'
import { HomePage } from './pages/HomePage'
import { BrandManualPage } from './pages/BrandManualPage'
import type { DraftKey, Drafts } from './utils/drafts'
import { DEFAULT_DESIGN, DEFAULT_VIEW, NO_CONTENT, useGroup } from './utils/appState'
import { DEFAULT_TITLE_STYLE } from './data/titleOptions'
import { DEFAULT_BRAND_FONTS } from './data/fontOptions'
import { loadGoogleFont } from './utils/googleFonts'
import { loadLocalTemplates } from './mockups/catalog'
import './css/App.css'

function App() {
  // Kept here, above the routes, so they survive moving between pages.
  // The forms send every change here, so the preview follows them live (see utils/appState).
  const [content, onContentChange] = useGroup(NO_CONTENT)
  // What each form shows (half-typed values too), so it is filled again on the way back.
  const [drafts, setDrafts] = useState<Drafts>({})
  // Always from the newest drafts, so two forms changing close together never undo each other.
  const onDraftChange = useCallback(<K extends DraftKey>(key: K, draft: Drafts[K]) => {
    setDrafts((prev) => ({ ...prev, [key]: draft }))
  }, [])
  const [view, onViewChange] = useGroup(DEFAULT_VIEW)
  const [design, onDesignChange] = useGroup(DEFAULT_DESIGN)

  // Photo templates for local tests only, if the file is there (see public/mockups/LICENSES.md)
  useEffect(() => {
    loadLocalTemplates()
  }, [])

  const fontFamily = content.cover?.style.fontFamily ?? DEFAULT_TITLE_STYLE.fontFamily
  useEffect(() => {
    loadGoogleFont(fontFamily)
  }, [fontFamily])

  // The brand fonts are only drawn in regular (see specs/typography.md). Every inner page is set
  // in them, so the defaults load from the start, before the section is touched (ADR 0029)
  const { primary, secondary } = content.typography ?? DEFAULT_BRAND_FONTS
  useEffect(() => {
    loadGoogleFont(primary, 'regular')
    loadGoogleFont(secondary, 'regular')
  }, [primary, secondary])

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
                content={content}
                onContentChange={onContentChange}
                view={view}
                onViewChange={onViewChange}
                design={design}
                onDesignChange={onDesignChange}
                drafts={drafts}
                onDraftChange={onDraftChange}
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
