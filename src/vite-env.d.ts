/// <reference types="vite/client" />

interface ImportMetaEnv {
  // The CMYK server's address, e.g. http://localhost:8787 (specs/cmykserver.md); unset → no server
  readonly VITE_CMYK_SERVER_URL?: string
}
