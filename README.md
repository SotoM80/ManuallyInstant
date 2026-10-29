# ManuallyInstant

A web app that builds a brand's visual identity manual in minutes.

🇬🇧 [English](#english) · 🇪🇸 [Español](#español)

---

## English

### What it does
Design agencies fill in seven sections, and the brand manual updates **live** next to the form:

1. **Cover**: manual title (font, style, size), the Cover's own colors, "Designed by" and the main logo.
2. **Logo**: brand name, the idea behind it, the kinds of mark it uses (Logotype, Isotype, Imagotype, Isologo), the official versions of the logo (Horizontal, Symbol only…) and its clear space and minimum sizes.
3. **Usage**: how the brand must and must not be used, with up to 6 examples per page (an image and a description), marked ✓ or ✕.
4. **Colors**: 1 to 6 colors, each with a name and its HEX, RGB and CMYK values (from the print profile with the optional CMYK server, approximate without it).
5. **Typography**: a primary and a secondary font from Google Fonts.
6. **Skin**: the background and text colors of the inner pages, and up to 4 decorative layers behind them.
7. **Mockups**: the logo on up to 4 products, illustrated by the app or from real photos.

Key features:
- **Two PDFs in one click**: **↓ Print PDF** (300 dpi, CMYK values highlighted) and **↓ Web PDF** (144 dpi, HEX and RGB highlighted, lightweight), at the top of the sections. Every page, in the chosen template, orientation and skin, looks as in the preview; empty sections are pointed out before downloading.
- **Real CMYK for print** *(optional)*: with the small CMYK server running, the print PDF comes out in real CMYK with an ICC profile (FOGRA39 for now), and the palette shows the same values as Illustrator (within a point). If the server cannot be reached, the app offers the RGB print PDF instead.
- **Live preview**: text, colors and fonts show as you type. A new image waits for the **Apply** button next to its field, so it is never swapped in by accident, and each Apply shows only its own image.
- **Full screen**: the **⤢ Full screen** button in the preview shows the 10 pages one below the other, drawn as in the PDF and each one fitted whole to the viewer's screen. Esc or **Exit full screen** closes it.
- **Work side by side**: when a section opens, it moves to the top of its column and its page moves to the top of the preview, at the same height. In the Logo and Usage sections, clicking in an area (Concept, Anatomy, Versions…, or Correct use and Incorrect use) makes its page the main one.
- **Logo scrolls on its own**: the long Logo section scrolls inside, so the preview stays still; at its top or bottom, the page scrolls on.
- **Construction grid drawn for you**: the app reads the logo's visible pixels and fits a grid of square modules to it (12, 16 or 24 across). X is a setting shared by the clear space and the grid; click the grid's rulers to place guides measured in X, and the logo's overall width and height are shown in X too. Uploading your own grid is still possible.
- **Layered logos from Illustrator**: export the logo as SVG (Object IDs: Layer Names) and choose it in an Anatomy card. Each layer becomes a part of the mark (up to 4), in reading order, cropped to what it draws. Layers named Isotipo, Logotipo or Tagline get their label on their own.
- **A background for each image**: under each Anatomy card and part, logo version and Usage example, **More** opens its own Background color (none by default), so a negative version can be shown on black. Clear space uses Version 1's.
- **Colors calculated for you**: pick a color and get its HEX, RGB and CMYK values. `CMYK ≈` marks an approximate value; plain `CMYK` is the print profile's.
- **Mockups** *(in progress)*: the logo on products (business card, t-shirt, mug), each with its color and logo version. Photo mockups tint a real product photo and blend the logo into it (printed or solid); drag it into place, or open the **template editor** to select the product with a magic wand and brush and mark the logo area with points, also at an angle or on a curve. You can upload your own photo too.
- **Skins in layers**: stack gradients (Linear, Radial), shapes (Circles, Diagonal block, Waves), patterns (Dots, Stripes), textures (Grain, Paper) and your own **Image** (a photo behind the pages, Cover or Contain, with its own Apply), each with its own sliders, colors and intensity. Tick a layer to show or hide it, move it up or down, and choose whether it is also drawn on the Cover. Any color can be picked, or copied from the palette.
- **Image boxes**: the corner radius, inner margin and outline of every image box are set once in the Skin, the same on every page and template.
- **Three templates**: centered (1), aligned left (2) or with a side column (3). They change where the content sits on each page, never the content itself.
- **Portrait or landscape**, and three ways to view the manual: Grid, Overview and Pages.

<!-- A screenshot of the Brand Manual page can go here. -->

### Status
- ✅ Every section (Cover, Logo, Usage, Colors, Typography, Skin), the live preview and the three templates.
- ✅ Logo pages: Brand concept, Anatomy, Logo versions and Clear space.
- ✅ Usage pages: Correct use and Incorrect use, each with a grid of up to 6 examples (see the [spec](specs/usage.md)). The manual has 10 pages.
- ✅ Anatomy parts filled from the layers of an SVG exported from Illustrator (see the [spec](specs/logolayers.md)).
- ✅ A construction grid drawn by the app, fitted to the logo, with guides and measures in X.
- ✅ Skins: page colors and up to 4 layers of gradients, shapes, patterns, textures and images (see the [spec](specs/skins.md)), and the style of the image boxes (see the [spec](specs/imageboxes.md)).
- ✅ A background color for each logo image (see the [spec](specs/imagebackground.md)).
- ✅ Export to two PDFs: one for print (300 dpi, CMYK values highlighted) and one for the web (144 dpi, HEX/RGB, lightweight) (see the [spec](specs/export.md)).
- ✅ An optional CMYK server: the print PDF in real CMYK and the palette's values from an ICC profile, checked against Illustrator (see the [spec](specs/cmykserver.md), ADRs [0018](docs/adr/0018-optional-stateless-cmyk-server.md) and [0019](docs/adr/0019-real-cmyk-with-icc-profile.md)).
- 🔜 Mockups (see the [spec](specs/mockups.md)): 3 illustrated products and a photo business card work, with the template editor; more products and licensed photos to come.
- 🔜 A last review of the layout of every page (Phase 3), and a vector print PDF with selectable text.

Limits: nothing is saved between sessions (refreshing clears the manual). Without the CMYK server, CMYK values are an approximation and the print PDF stays in RGB; with it, pages are images, so black text prints with the four inks. The server has no login yet. See [PLAN.md](PLAN.md) for the full list.

### How it was built
- **Specs first**: each feature is described before it is coded, with Given-When-Then scenarios, in [`specs/`](specs/).
- **Decisions on record**: every important choice, with the options weighed, is an Architecture Decision Record in [`docs/adr/`](docs/adr/README.md). For example: [live preview with Apply for images](docs/adr/0007-live-preview-with-apply-for-images.md), later [one Apply next to each image](docs/adr/0020-one-apply-per-image.md).
- **Tested**: around 510 tests with Jest and React Testing Library, written from the spec scenarios, and 23 for the CMYK server with Node's test runner.
- **One feature at a time**: each change is tried on its own branch and only reaches `main` once it works.

**Tech stack:** React 19 · TypeScript · Vite · Jest + React Testing Library · ESLint · pdf-lib. CMYK server *(optional)*: Node · Express · sharp · Little CMS (lcms-wasm)

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

#### The CMYK server (optional)
For the print PDF in real CMYK (Node 22.18 or newer):

1. Get a FOGRA39 ICC profile: ECI's *ISO Coated v2*, or Adobe's `CoatedFOGRA39.icc` (see [`server/profiles/README.md`](server/profiles/README.md)). Profiles are not kept in git.
2. `cd server && npm install && cp .env.example .env`, then set `CMYK_PROFILE_PATH` in `server/.env`.
3. In the project root, copy `.env.example` to `.env.local` (it sets `VITE_CMYK_SERVER_URL=http://localhost:8787`).
4. Run `npm run dev:server` in one terminal and `npm run dev` in another. Restart Vite after changing `.env.local`.

If Vite runs on another port than 5173, add it to `CORS_ORIGINS` in `server/.env`. More in [`server/README.md`](server/README.md).

#### Scripts
| Command | What it does |
|---|---|
| `npm run dev` | Starts the app with live reload |
| `npm run dev:server` | Starts the CMYK server, restarting on changes |
| `npm run build` | Checks the types and builds the app into `dist/` |
| `npm run preview` | Serves the built app from `dist/` |
| `npm test` | Runs every test of the app |
| `npm run test:server` | Runs the CMYK server's tests |
| `npm run test:coverage` | Runs the tests and reports coverage |
| `npm run lint` | Checks the code with ESLint |

#### Project structure
```
src/
├── components/        Forms and controls of each section (BrandForm, LogoForm, ColorsForm…)
│   └── pages/         One component per page of the manual (CoverPage, TypographyPage…)
├── data/              Lists and options: sections, pages, fonts, colors, texts
├── pages/             The app's routes: Home and Brand Manual
├── export/            The two PDFs: settings, file names, drawing the pages (ADR 0012) and the CMYK server client
├── mockups/           Mockup products, photo templates, the WebGL renderer and the editor's selection tools
├── skins/             Skin presets, layers and their drawings (pure functions in draw/)
├── templates/         CSS of Template 1, 2 and 3
└── utils/             Helpers: validation, Google Fonts, pending images, animations, CMYK values
server/                The optional CMYK server (its own package, specs/cmykserver.md)
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
Las agencias de diseño completan siete secciones, y el manual de marca se actualiza **en vivo** al lado del formulario:

1. **Cover** (portada): título del manual (fuente, estilo y tamaño), los colores propios de la portada, "Designed by" y el logotipo principal.
2. **Logo**: nombre de la marca, la idea detrás de ella, los tipos de marca que usa (Logotipo, Isotipo, Imagotipo, Isologo), las versiones oficiales del logo (Horizontal, Solo símbolo…) y su área de respeto y tamaños mínimos.
3. **Usage**: cómo se debe y cómo no se debe usar la marca, con hasta 6 ejemplos por hoja (una imagen y una descripción), marcados con ✓ o ✕.
4. **Colors**: de 1 a 6 colores, cada uno con su nombre y sus valores HEX, RGB y CMYK (del perfil de imprenta con el servidor CMYK opcional, aproximado sin él).
5. **Typography**: una fuente principal y una secundaria de Google Fonts.
6. **Skin**: los colores de fondo y de texto de las hojas interiores, y hasta 4 capas decorativas detrás de ellas.
7. **Mockups**: el logo en hasta 4 productos, ilustrados por la app o a partir de fotos reales.

Funciones clave:
- **Dos PDF con un clic**: **↓ Print PDF** (300 dpi, valores CMYK destacados) y **↓ Web PDF** (144 dpi, HEX y RGB destacados, liviano), arriba de las secciones. Todas las hojas, con la plantilla, la orientación y la skin elegidas, se ven como en la vista previa; antes de descargar se avisa si hay secciones vacías.
- **CMYK real para imprenta** *(opcional)*: con el pequeño servidor CMYK encendido, el PDF de imprenta sale en CMYK real con un perfil ICC (por ahora FOGRA39), y la paleta muestra los mismos valores que Illustrator (con un punto de diferencia como máximo). Si el servidor no responde, la app ofrece el PDF de imprenta en RGB.
- **Vista previa en vivo**: el texto, los colores y las fuentes se ven mientras escribes. Una imagen nueva espera al botón **Apply** que tiene al lado, así nunca se cambia por accidente, y cada Apply muestra solo su propia imagen.
- **Pantalla completa**: el botón **⤢ Full screen** del preview muestra las 10 hojas una debajo de otra, dibujadas como en el PDF y cada una ajustada entera a la pantalla de quien la mira. Esc o **Exit full screen** la cierran.
- **Trabajo lado a lado**: al abrir una sección, sube al primer lugar de su columna y su hoja sube al primer lugar del preview, a la misma altura. En las secciones Logo y Usage, al hacer clic en un área (Concept, Anatomy, Versions…, o Correct use e Incorrect use) su hoja pasa a ser la principal.
- **Logo con su propio scroll**: la sección Logo, que es larga, se desplaza por dentro y el preview no se mueve; al llegar arriba o abajo, sigue moviendo la página.
- **Retícula de construcción automática**: la app lee los píxeles visibles del logo y le ajusta una retícula de módulos cuadrados (12, 16 o 24 de ancho). X es un ajuste común al área de respeto y a la retícula; con un clic en las reglas de la retícula se colocan guías medidas en X, y también se muestran el ancho y el alto totales del logo en X. Se puede seguir subiendo una retícula propia.
- **Logos con capas desde Illustrator**: exporta el logo como SVG (Object IDs: Layer Names) y elígelo en una tarjeta de Anatomy. Cada capa pasa a ser una parte de la marca (hasta 4), en orden de lectura y recortada a lo que dibuja. Las capas llamadas Isotipo, Logotipo o Tagline reciben su etiqueta solas.
- **Un fondo para cada imagen**: bajo cada tarjeta y parte de Anatomy, cada versión del logo y cada ejemplo de Usage, **More** abre su propio color de fondo (ninguno por defecto), así una versión en negativo se puede mostrar sobre negro. Clear space usa el de la Version 1.
- **Colores calculados por ti**: eliges un color y obtienes sus valores HEX, RGB y CMYK. `CMYK ≈` marca un valor aproximado; `CMYK` a secas es el del perfil de imprenta.
- **Mockups** *(en desarrollo)*: el logo en productos (tarjeta, polera, taza), cada uno con su color y su versión de logo. Los mockups con foto tiñen una foto real del producto y mezclan el logo con ella (impreso o sólido); se ubica arrastrándolo, o con el **editor de plantillas** se selecciona el producto con varita mágica y pincel y se marca el área del logo con puntos, también en ángulo o en curva. También se puede subir una foto propia.
- **Skins en capas**: apila degradados (Linear, Radial), formas (Circles, Diagonal block, Waves), patrones (Dots, Stripes), texturas (Grain, Paper) y tu propia **Image** (una foto detrás de las hojas, Cover o Contain, con su propio Apply), cada uno con sus sliders, colores e intensidad. Con un check se muestra u oculta cada capa, se mueve arriba o abajo, y se elige si también va en la portada. Se puede elegir cualquier color, o copiarlo de la paleta.
- **Recuadros de imagen**: el radio de las esquinas, el margen interior y el contorno de todos los recuadros de imagen se definen una vez en la Skin, iguales en todas las hojas y plantillas.
- **Tres plantillas**: centrada (1), alineada a la izquierda (2) o con columna lateral (3). Cambian dónde se ubica el contenido en cada hoja, nunca el contenido.
- **Vertical o apaisado**, y tres formas de ver el manual: Grid, Overview y Pages.

<!-- Aquí puede ir una captura de la página Brand Manual. -->

### Estado
- ✅ Todas las secciones (Cover, Logo, Usage, Colors, Typography, Skin), la vista previa en vivo y las tres plantillas.
- ✅ Hojas de Logo: Brand concept, Anatomy, Logo versions y Clear space.
- ✅ Hojas de Usage: Correct use e Incorrect use, cada una con una grilla de hasta 6 ejemplos (ver el [spec](specs/usage.md)). El manual tiene 10 hojas.
- ✅ Las partes de Anatomy se llenan con las capas de un SVG exportado desde Illustrator (ver el [spec](specs/logolayers.md)).
- ✅ Una retícula de construcción dibujada por la app, ajustada al logo, con guías y medidas en X.
- ✅ Skins: colores de página y hasta 4 capas de degradados, formas, patrones, texturas e imágenes (ver el [spec](specs/skins.md)), y el estilo de los recuadros de imagen (ver el [spec](specs/imageboxes.md)).
- ✅ Un color de fondo para cada imagen del logo (ver el [spec](specs/imagebackground.md)).
- ✅ La exportación a dos PDF: uno para imprenta (300 dpi, valores CMYK destacados) y otro para web (144 dpi, HEX/RGB, liviano) (ver el [spec](specs/export.md)).
- ✅ Un servidor CMYK opcional: el PDF de imprenta en CMYK real y los valores de la paleta desde un perfil ICC, comprobados con Illustrator (ver el [spec](specs/cmykserver.md) y las ADR [0018](docs/adr/0018-optional-stateless-cmyk-server.md) y [0019](docs/adr/0019-real-cmyk-with-icc-profile.md)).
- 🔜 Mockups (ver el [spec](specs/mockups.md)): funcionan 3 productos ilustrados y una tarjeta con foto, con el editor de plantillas; faltan más productos y fotos con licencia.
- 🔜 Una última revisión del maquetado de cada hoja (Fase 3), y un PDF de imprenta vectorial con texto seleccionable.

Límites: no se guarda nada entre sesiones (al recargar se borra el manual). Sin el servidor CMYK, los valores CMYK son una aproximación y el PDF de imprenta sigue en RGB; con él, las hojas son imágenes, así que el texto negro se imprime con las cuatro tintas. El servidor todavía no tiene login. La lista completa está en [PLAN.md](PLAN.md).

### Cómo se construyó
- **Primero la spec**: cada feature se describe antes de programarla, con escenarios Given-When-Then, en [`specs/`](specs/).
- **Decisiones registradas**: cada decisión importante, con las opciones que se compararon, es un Architecture Decision Record en [`docs/adr/`](docs/adr/README.md). Por ejemplo: [vista previa en vivo con Apply para las imágenes](docs/adr/0007-live-preview-with-apply-for-images.md), y después [un Apply junto a cada imagen](docs/adr/0020-one-apply-per-image.md).
- **Con tests**: unos 510 tests con Jest y React Testing Library, escritos a partir de los escenarios de las specs, y 23 del servidor CMYK con el test runner de Node.
- **Una feature a la vez**: cada cambio se prueba en su propia rama y solo llega a `main` cuando funciona.

**Tecnologías:** React 19 · TypeScript · Vite · Jest + React Testing Library · ESLint · pdf-lib. Servidor CMYK *(opcional)*: Node · Express · sharp · Little CMS (lcms-wasm)

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

#### El servidor CMYK (opcional)
Para el PDF de imprenta en CMYK real (Node 22.18 o más nuevo):

1. Consigue un perfil ICC FOGRA39: el *ISO Coated v2* de ECI, o el `CoatedFOGRA39.icc` de Adobe (ver [`server/profiles/README.md`](server/profiles/README.md)). Los perfiles no se guardan en git.
2. `cd server && npm install && cp .env.example .env`, y pon `CMYK_PROFILE_PATH` en `server/.env`.
3. En la raíz del proyecto, copia `.env.example` a `.env.local` (define `VITE_CMYK_SERVER_URL=http://localhost:8787`).
4. Ejecuta `npm run dev:server` en una terminal y `npm run dev` en otra. Reinicia Vite si cambias `.env.local`.

Si Vite usa otro puerto que el 5173, añádelo a `CORS_ORIGINS` en `server/.env`. Más detalles en [`server/README.md`](server/README.md).

#### Scripts
| Comando | Qué hace |
|---|---|
| `npm run dev` | Arranca la app con recarga en vivo |
| `npm run dev:server` | Arranca el servidor CMYK, que se reinicia con cada cambio |
| `npm run build` | Revisa los tipos y genera la app en `dist/` |
| `npm run preview` | Sirve la app generada en `dist/` |
| `npm test` | Ejecuta todos los tests de la app |
| `npm run test:server` | Ejecuta los tests del servidor CMYK |
| `npm run test:coverage` | Ejecuta los tests y muestra la cobertura |
| `npm run lint` | Revisa el código con ESLint |

#### Estructura del proyecto
```
src/
├── components/        Formularios y controles de cada sección (BrandForm, LogoForm, ColorsForm…)
│   └── pages/         Un componente por hoja del manual (CoverPage, TypographyPage…)
├── data/              Listas y opciones: secciones, hojas, fuentes, colores, textos
├── pages/             Las rutas de la app: Home y Brand Manual
├── export/            Los dos PDF: ajustes, nombres de archivo, dibujo de las hojas (ADR 0012) y el cliente del servidor CMYK
├── mockups/           Productos de mockups, plantillas con foto, el motor WebGL y las herramientas de selección del editor
├── skins/             Presets, capas y dibujos de la Skin (funciones puras en draw/)
├── templates/         CSS de las plantillas 1, 2 y 3
└── utils/             Ayudantes: validación, Google Fonts, imágenes pendientes, animaciones, valores CMYK
server/                El servidor CMYK opcional (un paquete aparte, specs/cmykserver.md)
test/                  Tests con Jest + React Testing Library
specs/                 Qué hace cada feature (Given-When-Then)
docs/adr/              Architecture Decision Records
```

#### Añadir una sección
1. En [`src/data/manualSections.ts`](src/data/manualSections.ts), marca la sección con `ready: true` y pon sus hojas en `MANUAL_PAGES` y `SECTION_PAGES`.
2. En [`src/pages/BrandManualPage.tsx`](src/pages/BrandManualPage.tsx), conecta su formulario en `sectionForms`.
3. Añade un componente de hoja en `src/components/pages/` y dibújalo en `ManualPreview`.

Escribe primero su spec en `specs/` y añade sus tests en `test/`.
