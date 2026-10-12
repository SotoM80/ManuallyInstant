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

## Phase 3: 4-page template
- [ ] Cover → Logo → Color palette → Typography

## Phase 4: Export
- [ ] Print PDF (high resolution, CMYK values highlighted)
- [ ] Screen PDF (RGB/HEX, lightweight)

## Future
- [ ] Cover title uses the Primary font of the Typography section (today it keeps its own font picker)
- [ ] Mockups section (once the Logo section and Phases 3–4 are done): a new section and a page "5. Mockups" that shows the logo on products (business card, t-shirt, mug, tote bag, sign, phone screen)
  - Mockup images saved in `public/mockups/` (free license or own illustrations; same origin, so the PDF export can read them)
  - Data per mockup in `src/data/mockups.ts`: where the logo goes (% area), rotation/perspective, blend mode (`multiply` so it looks printed)
  - Reuse the Cover logo, the palette colors (product color) and the brand fonts; same pattern as Colors/Typography (collapsible section + preview page + a layout per template)
  - Start with CSS (logo `<img>` over the photo, `transform` + `mix-blend-mode`); move to canvas only if a mockup needs a curved logo
  - To decide: a fixed list vs the user uploading their own mockup photo; which mockups and colors the user can choose; a light/dark version of the logo for dark products
  - Updates the manual from 4 to 5 pages (CLAUDE.md, specs/brandmanual.md)
