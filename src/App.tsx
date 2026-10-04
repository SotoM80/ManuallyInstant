import { useEffect, useState } from 'react'
import { BrandForm } from './components/BrandForm'
import { DEFAULT_TITLE_STYLE, toTitleCss } from './data/titleOptions'
import { loadGoogleFont } from './utils/googleFonts'
import type { TitleStyle } from './types'
import './App.css'

function App() {
  const [brandTitle, setBrandTitle] = useState('')
  const [titleStyle, setTitleStyle] = useState<TitleStyle>(DEFAULT_TITLE_STYLE)

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
        <h1 style={toTitleCss(titleStyle)}>{brandTitle}</h1>
      </header>

      <main>
        <BrandForm onSubmit={handleSubmit} />
      </main>
    </>
  )
}

export default App
