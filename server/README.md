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

## Run it online
The server needs a host that keeps Node running (Render, Railway, Fly.io or your own server); a static host is not enough.

1. Start command: `npm start`, in the `server/` folder, with Node 22.18 or newer.
2. Upload `ISOcoated_v2_eci.icc` to the host (a secret file or a disk) and set `CMYK_PROFILE_PATH` to it. Use the ECI profile: Adobe's comes with Adobe's apps and is not meant to be shared from a server.
3. Set `CORS_ORIGINS` to the app's address, for example `https://my-app.netlify.app` (several separated by commas).
4. Serve it over `https://`: a page on `https` cannot call a server on `http`.
5. Check that the host accepts uploads of up to `MAX_PAGE_MB` (40 MB by default).

It has no login: anyone who knows its address can use it. `MAX_CONCURRENT`, `MAX_PAGE_MB` and `MAX_PAGE_PIXELS` limit the work it takes on. On free plans that sleep, the first export after a while can take up to a minute.

## Test it
```sh
npm test          # Node's test runner (node --test)
npm run typecheck
```

The tests use FOGRA39 when they find it (`CMYK_TEST_PROFILE`, or Adobe's `CoatedFOGRA39.icc`), and check its values against ColorSync and Illustrator; otherwise they use macOS's Generic CMYK profile. The server uses Node's test runner rather than Jest because lcms-wasm is only published as an ES module.

## How it converts
sharp decodes the PNG and puts it on white paper; lcms-wasm (Little CMS) converts its pixels from sRGB to the profile with Relative Colorimetric and black point compensation, as Adobe's apps do; zlib compresses them. A page of A4 at 300 dpi takes about 1.7 s.
