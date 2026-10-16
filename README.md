# ManuallyInstant

A web app that builds a brand's visual identity manual in minutes.

🇬🇧 [English](#english) · 🇪🇸 [Español](#español)

---

## English

### What it does
Design agencies fill in five sections, and the brand manual updates **live** next to the form:

1. **Cover**: manual title (font, style, size), the Cover's own colors, "Designed by" and the main logo.
2. **Logo**: brand name, the idea behind it, the kinds of mark it uses (Logotype, Isotype, Imagotype, Isologo), the official versions of the logo (Horizontal, Symbol only…) and its clear space and minimum sizes.
3. **Colors**: 1 to 6 colors, each with a name and its HEX, RGB and CMYK (approximate) values.
4. **Typography**: a primary and a secondary font from Google Fonts.
5. **Skin**: the background and text colors of the inner pages, and up to 4 decorative layers behind them.

Key features:
- **Two PDFs in one click**: **↓ Print PDF** (300 dpi, CMYK values highlighted) and **↓ Web PDF** (144 dpi, HEX and RGB highlighted, lightweight), next to Apply. Every page, in the chosen template, orientation and skin, looks as in the preview; empty sections are pointed out before downloading.
- **Live preview**: text, colors and fonts show as you type. A new image waits for the **Apply** button, so it is never swapped in by accident.
- **Work side by side**: when a section opens, it moves to the top of its column and its page moves to the top of the preview, at the same height. In the Logo section, clicking in an area (Concept, Anatomy, Versions…) makes its page the main one.
- **Logo scrolls on its own**: the long Logo section scrolls inside, so the preview stays still; at its top or bottom, the page scrolls on.
- **Construction grid drawn for you**: the app reads the logo's visible pixels and fits a grid of square modules to it (12, 16 or 24 across). X is a setting shared by the clear space and the grid; click the grid's rulers to place guides measured in X, and the logo's overall width and height are shown in X too. Uploading your own grid is still possible.
- **Colors calculated for you**: pick a color and get its HEX, RGB and CMYK values.
- **Skins in layers**: stack gradients (Linear, Radial), shapes (Circles, Diagonal block, Waves), patterns (Dots, Stripes) and textures (Grain, Paper), each with its own sliders, colors and intensity. Tick a layer to show or hide it, move it up or down, and choose whether it is also drawn on the Cover. Any color can be picked, or copied from the palette.
- **Three templates**: centered (1), aligned left (2) or with a side column (3). They change where the content sits on each page, never the content itself.
- **Portrait or landscape**, and three ways to view the manual: Grid, Overview and Pages.

<!-- A screenshot of the Brand Manual page can go here. -->

### Status
- ✅ Every section (Cover, Logo, Colors, Typography, Skin), the live preview and the three templates.
- ✅ Logo pages: Brand concept, Anatomy, Logo versions and Clear space.
- ✅ A construction grid drawn by the app, fitted to the logo, with guides and measures in X.
- ✅ Skins: page colors and up to 4 layers of gradients, shapes, patterns and textures (see the [spec](specs/skins.md)).
- ✅ Export to two PDFs: one for print (300 dpi, CMYK values highlighted) and one for the web (144 dpi, HEX/RGB, lightweight) (see the [spec](specs/export.md)).
- 🔜 A last review of the layout of every page (Phase 3), and a vector print PDF with selectable text.

Limits: it is frontend only, nothing is saved between sessions (refreshing clears the manual), and CMYK values are an approximation (the print PDF stays in RGB). See [PLAN.md](PLAN.md) for the full list.

### How it was built
- **Specs first**: each feature is described before it is coded, with Given-When-Then scenarios, in [`specs/`](specs/).
- **Decisions on record**: every important choice, with the options weighed, is an Architecture Decision Record in [`docs/adr/`](docs/adr/README.md). For example: [live preview with Apply for images](docs/adr/0007-live-preview-with-apply-for-images.md).
- **Tested**: around 320 tests with Jest and React Testing Library, written from the spec scenarios.
- **One feature at a time**: each change is tried on its own branch and only reaches `main` once it works.

**Tech stack:** React 19 · TypeScript · Vite · Jest + React Testing Library · ESLint

### For developers

#### Getting started
You need [Node.js](https://nodejs.org/) 20.19 or newer (or 22.12+), with npm.

```bash
git clone https://github.com/SotoM80/ManuallyInstant.git
cd ManuallyInstant
npm install
npm run dev
```

Then open the address Vite prints (usually http://localhost:5173) and go to **Brand Manual**.

#### Scripts
| Command | What it does |
|---|---|
| `npm run dev` | Starts the app with live reload |
| `npm run build` | Checks the types and builds the app into `dist/` |
| `npm run preview` | Serves the built app from `dist/` |
| `npm test` | Runs every test |
| `npm run test:coverage` | Runs the tests and reports coverage |
| `npm run lint` | Checks the code with ESLint |

#### Project structure
```
src/
├── components/        Forms and controls of each section (BrandForm, LogoForm, ColorsForm…)
│   └── pages/         One component per page of the manual (CoverPage, TypographyPage…)
├── data/              Lists and options: sections, pages, fonts, colors, texts
├── pages/             The app's routes: Home and Brand Manual
├── export/            The two PDFs: settings, file names and drawing the pages (ADR 0012)
├── skins/             Skin presets, layers and their drawings (pure functions in draw/)
├── templates/         CSS of Template 1, 2 and 3
└── utils/             Helpers: validation, Google Fonts, pending images, animations
test/                  Jest + React Testing Library tests
specs/                 What each feature does (Given-When-Then)
docs/adr/              Architecture Decision Records
```

#### Adding a section
1. In [`src/data/manualSections.ts`](src/data/manualSections.ts), set the section to `ready: true` and list its pages in `MANUAL_PAGES` and `SECTION_PAGES`.
2. In [`src/pages/BrandManualPage.tsx`](src/pages/BrandManualPage.tsx), plug its form into `sectionForms`.
3. Add a page component in `src/components/pages/` and draw it in `ManualPreview`.

Write its spec in `specs/` first, and add its tests in `test/`.

---

## Español

### Qué hace
Las agencias de diseño completan cinco secciones, y el manual de marca se actualiza **en vivo** al lado del formulario:

1. **Cover** (portada): título del manual (fuente, estilo y tamaño), los colores propios de la portada, "Designed by" y el logotipo principal.
2. **Logo**: nombre de la marca, la idea detrás de ella, los tipos de marca que usa (Logotipo, Isotipo, Imagotipo, Isologo), las versiones oficiales del logo (Horizontal, Solo símbolo…) y su área de respeto y tamaños mínimos.
3. **Colors**: de 1 a 6 colores, cada uno con su nombre y sus valores HEX, RGB y CMYK (aproximado).
4. **Typography**: una fuente principal y una secundaria de Google Fonts.
5. **Skin**: los colores de fondo y de texto de las hojas interiores, y hasta 4 capas decorativas detrás de ellas.

Funciones clave:
- **Dos PDF con un clic**: **↓ Print PDF** (300 dpi, valores CMYK destacados) y **↓ Web PDF** (144 dpi, HEX y RGB destacados, liviano), junto a Apply. Todas las hojas, con la plantilla, la orientación y la skin elegidas, se ven como en la vista previa; antes de descargar se avisa si hay secciones vacías.
- **Vista previa en vivo**: el texto, los colores y las fuentes se ven mientras escribes. Una imagen nueva espera al botón **Apply**, así nunca se cambia por accidente.
- **Trabajo lado a lado**: al abrir una sección, sube al primer lugar de su columna y su hoja sube al primer lugar del preview, a la misma altura. En la sección Logo, al hacer clic en un área (Concept, Anatomy, Versions…) su hoja pasa a ser la principal.
- **Logo con su propio scroll**: la sección Logo, que es larga, se desplaza por dentro y el preview no se mueve; al llegar arriba o abajo, sigue moviendo la página.
- **Retícula de construcción automática**: la app lee los píxeles visibles del logo y le ajusta una retícula de módulos cuadrados (12, 16 o 24 de ancho). X es un ajuste común al área de respeto y a la retícula; con un clic en las reglas de la retícula se colocan guías medidas en X, y también se muestran el ancho y el alto totales del logo en X. Se puede seguir subiendo una retícula propia.
- **Colores calculados por ti**: eliges un color y obtienes sus valores HEX, RGB y CMYK.
- **Skins en capas**: apila degradados (Linear, Radial), formas (Circles, Diagonal block, Waves), patrones (Dots, Stripes) y texturas (Grain, Paper), cada uno con sus sliders, colores e intensidad. Con un check se muestra u oculta cada capa, se mueve arriba o abajo, y se elige si también va en la portada. Se puede elegir cualquier color, o copiarlo de la paleta.
- **Tres plantillas**: centrada (1), alineada a la izquierda (2) o con columna lateral (3). Cambian dónde se ubica el contenido en cada hoja, nunca el contenido.
- **Vertical o apaisado**, y tres formas de ver el manual: Grid, Overview y Pages.

<!-- Aquí puede ir una captura de la página Brand Manual. -->

### Estado
- ✅ Todas las secciones (Cover, Logo, Colors, Typography, Skin), la vista previa en vivo y las tres plantillas.
- ✅ Hojas de Logo: Brand concept, Anatomy, Logo versions y Clear space.
- ✅ Una retícula de construcción dibujada por la app, ajustada al logo, con guías y medidas en X.
- ✅ Skins: colores de página y hasta 4 capas de degradados, formas, patrones y texturas (ver el [spec](specs/skins.md)).
- ✅ La exportación a dos PDF: uno para imprenta (300 dpi, valores CMYK destacados) y otro para web (144 dpi, HEX/RGB, liviano) (ver el [spec](specs/export.md)).
- 🔜 Una última revisión del maquetado de cada hoja (Fase 3), y un PDF de imprenta vectorial con texto seleccionable.

Límites: es solo frontend, no se guarda nada entre sesiones (al recargar se borra el manual) y los valores CMYK son una aproximación (el PDF de imprenta sigue en RGB). La lista completa está en [PLAN.md](PLAN.md).

### Cómo se construyó
- **Primero la spec**: cada feature se describe antes de programarla, con escenarios Given-When-Then, en [`specs/`](specs/).
- **Decisiones registradas**: cada decisión importante, con las opciones que se compararon, es un Architecture Decision Record en [`docs/adr/`](docs/adr/README.md). Por ejemplo: [vista previa en vivo con Apply para las imágenes](docs/adr/0007-live-preview-with-apply-for-images.md).
- **Con tests**: unos 320 tests con Jest y React Testing Library, escritos a partir de los escenarios de las specs.
- **Una feature a la vez**: cada cambio se prueba en su propia rama y solo llega a `main` cuando funciona.

**Tecnologías:** React 19 · TypeScript · Vite · Jest + React Testing Library · ESLint

### Para desarrolladores

#### Cómo empezar
Necesitas [Node.js](https://nodejs.org/) 20.19 o más nuevo (o 22.12+), con npm.

```bash
git clone https://github.com/SotoM80/ManuallyInstant.git
cd ManuallyInstant
npm install
npm run dev
```

Después abre la dirección que muestra Vite (normalmente http://localhost:5173) y entra en **Brand Manual**.

#### Scripts
| Comando | Qué hace |
|---|---|
| `npm run dev` | Arranca la app con recarga en vivo |
| `npm run build` | Revisa los tipos y genera la app en `dist/` |
| `npm run preview` | Sirve la app generada en `dist/` |
| `npm test` | Ejecuta todos los tests |
| `npm run test:coverage` | Ejecuta los tests y muestra la cobertura |
| `npm run lint` | Revisa el código con ESLint |

#### Estructura del proyecto
```
src/
├── components/        Formularios y controles de cada sección (BrandForm, LogoForm, ColorsForm…)
│   └── pages/         Un componente por hoja del manual (CoverPage, TypographyPage…)
├── data/              Listas y opciones: secciones, hojas, fuentes, colores, textos
├── pages/             Las rutas de la app: Home y Brand Manual
├── export/            Los dos PDF: ajustes, nombres de archivo y dibujo de las hojas (ADR 0012)
├── skins/             Presets, capas y dibujos de la Skin (funciones puras en draw/)
├── templates/         CSS de las plantillas 1, 2 y 3
└── utils/             Ayudantes: validación, Google Fonts, imágenes pendientes, animaciones
test/                  Tests con Jest + React Testing Library
specs/                 Qué hace cada feature (Given-When-Then)
docs/adr/              Architecture Decision Records
```

#### Añadir una sección
1. En [`src/data/manualSections.ts`](src/data/manualSections.ts), marca la sección con `ready: true` y pon sus hojas en `MANUAL_PAGES` y `SECTION_PAGES`.
2. En [`src/pages/BrandManualPage.tsx`](src/pages/BrandManualPage.tsx), conecta su formulario en `sectionForms`.
3. Añade un componente de hoja en `src/components/pages/` y dibújalo en `ManualPreview`.

Escribe primero su spec en `specs/` y añade sus tests en `test/`.
