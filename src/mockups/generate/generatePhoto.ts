// Product photos made by an image API, opened in the template editor like an uploaded photo
// (see specs/mockups.md, Generated photos, and ADR 0016). The key is the user's own: it is sent
// to the provider, in a header, and nowhere else.

// Keeps the photo light and empty, so it can be tinted and no fake logo appears
export const PROMPT_SUFFIX =
  ', blank, unbranded, plain white product, no logo, no text, front view, studio lighting, plain light background'
export const MAX_PRODUCT_LENGTH = 100

export function buildPrompt(product: string) {
  return product.trim() + PROMPT_SUFFIX
}

export type PhotoRequest = { product: string; apiKey: string; signal?: AbortSignal }

// What went wrong, as the panel tells it
export type PhotoFailure = 'key' | 'billing' | 'quota' | 'refused' | 'network' | 'other'

export const PHOTO_FAILURES: Record<PhotoFailure, string> = {
  key: 'The API key was not accepted',
  billing: 'Your Gemini plan does not include images; turn on billing in Google AI Studio',
  quota: 'Too many requests or no credit left with the provider',
  refused: 'The provider refused this description; try other words',
  network: 'Could not reach the provider; check the connection',
  other: 'The photo could not be generated',
}

export class PhotoError extends Error {
  readonly failure: PhotoFailure
  constructor(failure: PhotoFailure) {
    super(PHOTO_FAILURES[failure])
    this.failure = failure
  }
}

// One provider. Moving to a proxy (ADR 0016, option B) is another of these.
export type PhotoGenerator = {
  generate: (request: PhotoRequest, fetchFile?: typeof fetch) => Promise<Blob>
}

const GEMINI_MODEL = 'gemini-3.1-flash-image'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

type GeminiPart = { inlineData?: { mimeType: string; data: string } }
type GeminiAnswer = {
  candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[]
  promptFeedback?: { blockReason?: string }
  error?: { status?: string; message?: string }
}

function base64ToBlob(data: string, type: string) {
  const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0))
  return new Blob([bytes], { type })
}

// Gemini answers a wrong key with 400, not 401, and the free tier's missing image quota with a
// 429 whose limit is 0 (seen in the spike, ADR 0016)
function failureOf(status: number, error: GeminiAnswer['error']): PhotoFailure {
  const message = error?.message ?? ''
  if (status === 401 || status === 403 || (status === 400 && /api key/i.test(message))) return 'key'
  if (status === 429) return /limit: 0\b|free_tier/i.test(message) ? 'billing' : 'quota'
  return 'other'
}

export const geminiGenerator: PhotoGenerator = {
  async generate({ product, apiKey, signal }, fetchFile = globalThis.fetch) {
    let response: Response
    try {
      response = await fetchFile(GEMINI_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey.trim() },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(product) }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }),
        signal,
      })
    } catch (error) {
      if (signal?.aborted) throw error // cancelled: not a failure to show
      throw new PhotoError('network')
    }
    const answer: GeminiAnswer = await response.json().catch(() => ({}))
    if (!response.ok) throw new PhotoError(failureOf(response.status, answer.error))
    const candidate = answer.candidates?.[0]
    const image = candidate?.content?.parts?.find((part) => part.inlineData)?.inlineData
    if (image) return base64ToBlob(image.data, image.mimeType)
    // No image: refused for its content, or something else
    const refused = answer.promptFeedback?.blockReason || /SAFETY|PROHIBITED|BLOCK/.test(candidate?.finishReason ?? '')
    throw new PhotoError(refused ? 'refused' : 'other')
  },
}
