import { useEffect, useRef, useState } from 'react'
import { MAX_PRODUCT_LENGTH, PHOTO_FAILURES, PhotoError, geminiGenerator } from '../mockups/generate/generatePhoto'

// Generate a photo (specs/mockups.md, Generated photos): a product's photo from a few words, made
// with the user's own Gemini key, then opened in the template editor like an uploaded photo. The
// key lives only in this component's state: never stored, logged or exported (ADR 0016). The panel
// folds with `hidden` instead of unmounting, so the key and the product stay for another try.
export function GeneratePhotoPanel({ onPhoto }: { onPhoto: (url: string, name: string) => void }) {
  const [open, setOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [product, setProduct] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const request = useRef<AbortController | null>(null)

  // A request still running when the section goes away is dropped
  useEffect(() => () => request.current?.abort(), [])

  async function generate() {
    const controller = new AbortController()
    request.current = controller
    setBusy(true)
    setError('')
    try {
      const photo = await geminiGenerator.generate({ product, apiKey, signal: controller.signal })
      onPhoto(URL.createObjectURL(photo), product.trim())
    } catch (failure) {
      // Cancelled: nothing to tell
      if (!controller.signal.aborted) setError(failure instanceof PhotoError ? failure.message : PHOTO_FAILURES.other)
    } finally {
      if (request.current === controller) {
        request.current = null
        setBusy(false)
      }
    }
  }

  function cancel() {
    request.current?.abort()
    request.current = null
    setBusy(false)
  }

  return (
    <div className="mockup-generate">
      <button
        type="button"
        className="palette-secondary-button"
        aria-expanded={open}
        aria-controls="mockup-generate-panel"
        onClick={() => setOpen(!open)}
      >
        Generate a photo
      </button>
      <div id="mockup-generate-panel" className="mockup-generate-panel" hidden={!open}>
        <p className="logo-form-hint">
          Photos are made by Google Gemini with your own API key, and Google bills you for them (the free tier makes
          no images). The key is kept only until the page is refreshed.{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
            Get a key
          </a>
        </p>
        <label htmlFor="mockup-generate-key">API key</label>
        <input
          id="mockup-generate-key"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
        />
        <label htmlFor="mockup-generate-product">Product</label>
        <input
          id="mockup-generate-product"
          type="text"
          maxLength={MAX_PRODUCT_LENGTH}
          placeholder="ceramic mug"
          value={product}
          onChange={(event) => setProduct(event.target.value)}
        />
        <div className="mockup-generate-actions">
          {busy && (
            <button type="button" className="palette-secondary-button" onClick={cancel}>
              Cancel
            </button>
          )}
          <button
            type="button"
            className="palette-secondary-button"
            disabled={busy || !apiKey.trim() || !product.trim()}
            onClick={generate}
          >
            {busy ? 'Generating…' : 'Generate'}
          </button>
        </div>
        {error && (
          <p className="export-message" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
