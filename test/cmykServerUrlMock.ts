// Stands in for src/export/cmykServerUrl.ts in Jest, which cannot read import.meta (jest.config.js).
// No server by default, so every test works as the app without one; a test can set one.
let url: string | null = null

export function cmykServerUrl() {
  return url
}

export function setCmykServerUrl(value: string | null) {
  url = value
}
