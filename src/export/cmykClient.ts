import type { Cmyk } from '../data/colorPalette'

// The only place that calls the CMYK server (specs/cmykserver.md). Every failure is a
// CmykServerError with one of three kinds, and each one leads to something different:
// unreachable → the app offers the RGB print PDF; busy → tried once more; rejected → an error.
export type CmykServerErrorKind = 'unreachable' | 'busy' | 'rejected'

export class CmykServerError extends Error {
  readonly kind: CmykServerErrorKind
  constructor(kind: CmykServerErrorKind, message: string) {
    super(message)
    this.kind = kind
  }
}

export type CmykProfileInfo = { id: string; name: string }
export type CmykPage = { width: number; height: number; bytes: Uint8Array } // zlib-compressed CMYK

const HEALTH_MS = 3000
const COLORS_MS = 5000
const PAGE_MS = 60000
const BUSY_RETRY_MS = 2000

// fetch with a time limit: no answer in time, or no answer at all, is "unreachable"
async function call(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let response: Response
  try {
    response = await fetch(url, { ...init, signal: controller.signal })
  } catch {
    throw new CmykServerError('unreachable', `The CMYK server at ${url} did not answer`)
  } finally {
    clearTimeout(timer)
  }
  if (response.status === 503) throw new CmykServerError('busy', 'The CMYK server is busy')
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new CmykServerError('rejected', body?.message ?? `The CMYK server answered ${response.status}`)
  }
  return response
}

// "Are you there?", before an export draws any page
export async function checkServer(server: string): Promise<{ profile: CmykProfileInfo }> {
  const response = await call(`${server}/v1/health`, {}, HEALTH_MS)
  const body = await response.json()
  return { profile: body.profile }
}

// The profile's CMYK for palette colors, in the order asked
export async function fetchCmykColors(
  server: string,
  hexes: string[],
): Promise<{ profile: CmykProfileInfo; colors: { hex: string; cmyk: Cmyk }[] }> {
  const response = await call(
    `${server}/v1/cmyk/colors`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ colors: hexes }) },
    COLORS_MS,
  )
  return response.json()
}

// One page of the print PDF (a PNG) as its CMYK pixels, with one more try if the server is busy
export async function convertPage(server: string, png: Blob): Promise<CmykPage> {
  const send = () =>
    call(`${server}/v1/cmyk/page`, { method: 'POST', headers: { 'Content-Type': 'image/png' }, body: png }, PAGE_MS)
  let response: Response
  try {
    response = await send()
  } catch (error) {
    if (!(error instanceof CmykServerError && error.kind === 'busy')) throw error
    await new Promise((wait) => setTimeout(wait, BUSY_RETRY_MS))
    response = await send()
  }
  const width = Number(response.headers.get('X-Cmyk-Width'))
  const height = Number(response.headers.get('X-Cmyk-Height'))
  if (!width || !height) throw new CmykServerError('rejected', 'The CMYK server did not give the page size')
  return { width, height, bytes: new Uint8Array(await response.arrayBuffer()) }
}
