// The CMYK server's address, without a final slash, or null when the app has none and works as
// before (specs/cmykserver.md, ADR 0018). The only place that reads it: Jest cannot read
// import.meta, so tests swap this module for test/cmykServerUrlMock.ts (jest.config.js).
export function cmykServerUrl(): string | null {
  const url = import.meta.env.VITE_CMYK_SERVER_URL?.trim().replace(/\/+$/, '')
  return url || null
}
