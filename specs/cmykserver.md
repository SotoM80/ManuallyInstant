# Technical Specification: CMYK Server

## 1. What it does
A small, optional server converts to **real CMYK** with an ICC profile (ADRs 0018 and 0019). It does two jobs for the app: it turns palette colors into CMYK values, and it turns one page of the print PDF (a PNG) into that page's CMYK pixels. It keeps nothing: no accounts, no files, no logs of what it receives. When the app has no server address, it works as before (approximate CMYK, RGB print PDF).

## Out of Scope
* Login, accounts, API keys or rate limits per user (a later decision; see ADR 0018).
* Building the PDF: the browser does it (see `export.md`).
* Saving manuals, pages or colors.
* Choosing the profile in the app: the server has one profile, set when it starts.
* Rendering intents other than Perceptual; output intents or PDF/X.
* The web PDF, which never uses the server.

## 2. Interface

### Running it
* The server lives in `server/`, with its own `package.json`. `npm run dev:server` (from the project root) starts it on port `8787`, next to `npm run dev`.
* The app reads the address from `VITE_CMYK_SERVER_URL` (in `.env.local`, e.g. `http://localhost:8787`). Without it, the app never calls a server.

### Settings (environment variables of the server)
| Variable | Default | What it sets |
|---|---|---|
| `PORT` | `8787` | Port to listen on |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated list of sites allowed to call it |
| `CMYK_PROFILE_PATH` | `profiles/ISOcoated_v2_eci.icc` | The ICC profile file |
| `CMYK_PROFILE_ID` | `FOGRA39` | Short id of the profile |
| `CMYK_PROFILE_NAME` | `ISO Coated v2 (ECI)` | Name shown in the manual |
| `MAX_PAGE_MB` | `40` | Largest page accepted |
| `MAX_PAGE_PIXELS` | `25000000` | Largest page in pixels |
| `MAX_CONCURRENT` | `2` | Pages converted at the same time |

The profile file is downloaded from eci.org by the studio and is not kept in git (`server/profiles/README.md` says where to get it). At start, the server checks that the file is a CMYK output profile. If the file is missing, it uses sharp's built-in `cmyk` profile, named `Generic CMYK (built-in)`, and prints a warning. If the file exists but is not a CMYK output profile, the server does not start.

### Common rules
* Every route is under `/v1`. Every answer has `Cache-Control: no-store`.
* Errors are JSON: `{ "error": "<code>", "message": "<sentence>" }`.
* CORS allows only `CORS_ORIGINS`, with `GET`, `POST` and `OPTIONS`, and exposes `X-Cmyk-Width`, `X-Cmyk-Height` and `X-Cmyk-Profile-Id`. A site not on the list gets no CORS headers.
* The server never writes to disk, never logs a request body and keeps no image cached after a request. It logs one line per request: method, path, status, time and size.

### `GET /v1/health`
`200`:
```json
{ "ok": true, "api": 1,
  "profile": { "id": "FOGRA39", "name": "ISO Coated v2 (ECI)", "builtIn": false },
  "limits": { "maxPageBytes": 41943040, "maxPagePixels": 25000000, "maxColors": 64 } }
```

### `POST /v1/cmyk/colors`
Body (`application/json`, 8 KB at most): `{ "colors": ["#1E88E5", "#000000"] }`, 1 to 64 colors as `#RRGGBB` (any case).

`200`: the colors in the same order, with whole percentages (0 = no ink):
```json
{ "profile": { "id": "FOGRA39", "name": "ISO Coated v2 (ECI)", "builtIn": false },
  "colors": [ { "hex": "#1E88E5", "cmyk": { "c": 80, "m": 42, "y": 0, "k": 0 } } ] }
```
(The numbers are an example; the real ones come from the profile.)

### `POST /v1/cmyk/page`
Body (`image/png`): one page drawn by the app.

`200` (`application/octet-stream`): the page's CMYK pixels, 8 bits per channel, in the order C, M, Y, K, with 0 = no ink, row by row, compressed with zlib (what a PDF calls `FlateDecode`). The headers `X-Cmyk-Width` and `X-Cmyk-Height` give its size in pixels, and `X-Cmyk-Profile-Id` gives the profile. Transparent pixels become white paper (no ink).

### Errors
| Status | `error` | When |
|---|---|---|
| 400 | `invalid_colors` | No colors, more than 64, or a value that is not `#RRGGBB` |
| 413 | `too_large` | The page is bigger than `MAX_PAGE_MB` |
| 415 | `unsupported_type` | Wrong `Content-Type` |
| 422 | `not_an_image` | The body is not a PNG |
| 422 | `too_many_pixels` | The page is bigger than `MAX_PAGE_PIXELS` |
| 503 | `busy` | `MAX_CONCURRENT` pages are already being converted (with `Retry-After: 2`) |
| 500 | `conversion_failed` | The conversion failed or did not give 4 channels |

### In the code
* `server/src/config.ts`: reads the settings. Pure, unit tested.
* `server/src/profile.ts`: finds and checks the profile, or falls back to the built-in one.
* `server/src/convert.ts`: `pageToCmyk(png)` and `colorsToCmyk(hexes)`, both with `withIccProfile(profile).raw()`, never `toColourspace('cmyk')` (ADR 0019).
* `server/src/limit.ts`: the limit of pages converted at the same time.
* `server/src/app.ts`: the routes, CORS and errors. `server/src/index.ts` starts it.
* In the app, `src/export/cmykServerUrl.ts` is the only place that reads `VITE_CMYK_SERVER_URL`, and `src/export/cmykClient.ts` is the only place that calls the server.

## 3. Preconditions & Postconditions
* **Preconditions**: The server is running, and the app's `VITE_CMYK_SERVER_URL` points to it.
* **Postconditions**: Every converted color and page used the server's one profile, and the server keeps nothing of them.

## 4. Invariants
* The same color always gives the same CMYK values with the same profile.
* A page and the palette colors on it are converted with the same profile.
* An answer to `/v1/cmyk/page` always has 4 channels; the server never sends RGB as CMYK.
* White (`#FFFFFF`, or a transparent pixel) is always `0, 0, 0, 0`.
* Nothing received is written to disk or logged.

## Failure Modes
* **No profile file**: the server starts with the built-in profile and says so in `/v1/health` (`builtIn: true`); the manual names it `Generic CMYK (built-in)`.
* **A profile that is not a CMYK output profile**: the server does not start, and says why.
* **Bad requests**: the errors in the table above. What the app does with them is in `export.md` and `colorpalette.md`.

## 5. Given-When-Then Test Criteria

### Scenario 1: Health
* **Given**: The server started with the FOGRA39 profile.
* **When**: The app calls `GET /v1/health`.
* **Then**: It answers `ok: true`, `api: 1` and the profile `FOGRA39`, `ISO Coated v2 (ECI)`, `builtIn: false`.

### Scenario 2: No Profile File
* **Given**: `CMYK_PROFILE_PATH` points to a file that does not exist.
* **When**: The server starts.
* **Then**: It prints a warning, starts, and `/v1/health` shows `Generic CMYK (built-in)` with `builtIn: true`.

### Scenario 3: Colors
* **Given**: The server is running.
* **When**: The app sends `{ "colors": ["#ffffff", "#000000", "#1E88E5"] }`.
* **Then**: It answers the three colors in that order, as `#FFFFFF`, `#000000` and `#1E88E5`. White is `0, 0, 0, 0`, black has K of 85 or more with some C, M and Y (rich black), and every value is a whole number from 0 to 100.

### Scenario 4: Bad Colors
* **Given**: The server is running.
* **When**: The app sends no colors, 65 colors, or `"blue"`.
* **Then**: It answers `400` with `invalid_colors`.

### Scenario 5: A Page
* **Given**: A 20 × 10 PNG, half white and half transparent.
* **When**: The app sends it to `/v1/cmyk/page`.
* **Then**: It answers `200` with `X-Cmyk-Width: 20` and `X-Cmyk-Height: 10`, and the body, once inflated, has 20 × 10 × 4 bytes, all 0.

### Scenario 6: Not a PNG
* **Given**: The server is running.
* **When**: The app sends text with `Content-Type: text/plain`, or random bytes as `image/png`.
* **Then**: It answers `415` with `unsupported_type`, or `422` with `not_an_image`.

### Scenario 7: Too Large
* **Given**: `MAX_PAGE_MB` is 1.
* **When**: The app sends a 2 MB page.
* **Then**: It answers `413` with `too_large`.

### Scenario 8: Busy
* **Given**: `MAX_CONCURRENT` pages are being converted.
* **When**: The app sends another page.
* **Then**: It answers `503` with `busy` and `Retry-After: 2`.

### Scenario 9: Allowed Sites
* **Given**: `CORS_ORIGINS` is `http://localhost:5173`.
* **When**: A request comes from `http://localhost:5173`, and another from `https://example.com`.
* **Then**: The first gets `Access-Control-Allow-Origin` and the exposed `X-Cmyk-*` headers; the second gets no CORS headers.

### Scenario 10: The Profile Matches ColorSync
* **Given**: The server uses the FOGRA39 file.
* **When**: The app converts `#1E88E5`, `#E53935` and `#000000`.
* **Then**: Each value is within 1 of what macOS ColorSync Utility's calculator gives for the same profile, with the Perceptual intent. (This test only runs where the profile file is present.)
