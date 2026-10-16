# Task Plan

## Phase 1: Setup
- [x] Clean up App.tsx (remove the Vite starter page)
- [x] Configure Jest for TypeScript + jsdom
- [x] Create src/types.ts (brand manual data model)

## Phase 2: Brand data input
- [x] Brand title
- [x] Logo upload (in the Cover section, see specs/cover.md)
- [x] Google Fonts selection (primary and secondary, see specs/typography.md)
- [x] Color picker with name (HEX / RGB / CMYK, see specs/colorpalette.md)
- [x] Template selector (3 different templates to create each manual, see specs/templates.md)

## Phase 3: The manual's pages
- [x] Cover → Brand concept → Anatomy → Logo versions → Clear space → Color palette → Typography (7 pages, in the three templates)
- [x] Logo section: concept, anatomy, versions, clear space with a construction grid drawn from the logo (ADR 0008)
- [x] Skin section: page colors and up to 4 decorative layers (gradients, shapes, patterns), also on the Cover per layer (specs/skins.md, ADRs 0009–0011)
- [ ] Review the final layout of every page before the export (spacing, page breaks, long texts)

## Phase 4: Export
- [x] Choose the technique: pages drawn as images with html-to-image + jsPDF (html2canvas cannot read the templates' `color-mix()`; a vector PDF needs a second layout)
- [x] ADR 0012: PDF pages drawn as images
- [x] Spec `specs/export.md`: the two PDFs, an incomplete manual, hidden guide bands of 3.2
- [x] Print PDF (300 dpi PNG, CMYK values highlighted)
- [x] Screen PDF (144 dpi JPEG, HEX/RGB highlighted, lightweight)
- [x] The skin and the construction grid drawn in both PDFs as in the preview

## Future
- [ ] Vector print PDF (svg2pdf.js): selectable text and embedded fonts (a new ADR)
- [x] Skin textures: Grain and Paper (`feTurbulence`, drawn by the browser in the PDF too)
- [ ] Revisit the textures after more use: how dense the grain is and how strong the fibers are (`gain` and `cut` in `src/skins/draw/grain.ts` and `paper.ts`), maybe more textures
- [ ] Move skin layers by drag and drop, on top of the ↑ ↓ buttons (optional)
- [ ] Cover title uses the Primary font of the Typography section (today it keeps its own font picker)
- [ ] Mockups section and page "8. Mockups" (specs/mockups.md, ADR 0013): the logo on up to 4 of 6 products drawn by the app as SVG from plain data, each with its color and logo version
  - [x] Spec and ADR 0013
  - [ ] Stable ids for the logo versions (`LogoVariant.id`)
  - [ ] Data, functions, `MockupArt`, the page, the template CSS and the section with 3 products (Business card, T-shirt, Mug)
  - [ ] Letterhead, Tote bag and Phone
  - [ ] README
  - [ ] Later: Envelope, Cap, Storefront sign, Bottle, Browser
