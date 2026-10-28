# CMYK server

A small, optional server that converts palette colors and pages of the print PDF to real CMYK with an ICC profile (`specs/cmykserver.md`, ADRs 0018 and 0019). It keeps nothing: no accounts, no files, no logs of what it receives. The app works without it.

## Run it
Needs Node 22.18 or newer (it runs the `.ts` files as they are).

```sh
cd server
npm install
cp .env.example .env      # then set CMYK_PROFILE_PATH (see profiles/README.md)
npm run dev               # http://localhost:8787, restarts on changes
```

From the project root, `npm run dev:server` does the same as `npm run dev` here. In the app, set `VITE_CMYK_SERVER_URL=http://localhost:8787` in `.env.local`.

Check it: `curl http://localhost:8787/v1/health`.

## Test it
```sh
npm test          # Node's test runner (node --test)
npm run typecheck
```

The tests use FOGRA39 when they find it (`CMYK_TEST_PROFILE`, or Adobe's `CoatedFOGRA39.icc`), and check its values against ColorSync and Illustrator; otherwise they use macOS's Generic CMYK profile. The server uses Node's test runner rather than Jest because lcms-wasm is only published as an ES module.

## How it converts
sharp decodes the PNG and puts it on white paper; lcms-wasm (Little CMS) converts its pixels from sRGB to the profile with Relative Colorimetric and black point compensation, as Adobe's apps do; zlib compresses them. A page of A4 at 300 dpi takes about 1.7 s.
