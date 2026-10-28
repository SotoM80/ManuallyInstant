# 🇬🇧 ENGLISH

## Project
A web application built with React, Vite and TypeScript that automates the creation of visual identity manuals. Design agencies fill in the cover (brand manual title with its style, "Designed by" and their primary logo), select Google Fonts (primary and secondary) and set up color palettes with an interactive picker that automatically calculates HEX, RGB and CMYK values, with a free-text name for each color. All this content is organized dynamically into a clean, responsive 10-page manual: cover → logo (brand concept, anatomy, versions, clear space) → usage (correct and incorrect use, with up to 6 examples each) → color palette → typography → mockups (the logo on up to 4 products: illustrations drawn by the app, or real photos tinted in WebGL, with a template editor). The user chooses one of three templates (Template 1, 2 or 3); a template only changes where the content sits on each page, never the content itself. The user can also set a skin: the background and text colors of every page but the Cover, and up to 4 decorative layers (gradients, shapes, patterns, textures) behind them, each with its own colors (picked freely or copied from the palette), independent of the template. Finally, the system exports the final document as two PDF files: one for print (high resolution, CMYK values highlighted) and one for screen or online use (RGB/HEX, lightweight).

Nothing is saved between sessions. An optional, stateless CMYK server in `server/` (ADRs 0018 and 0019, `specs/cmykserver.md`) converts with an ICC profile (FOGRA39, Relative Colorimetric with black point compensation, colors read as sRGB): with it, the palette shows the profile's CMYK values and the print PDF is in real CMYK; without it (no `VITE_CMYK_SERVER_URL`), CMYK is an approximation and the print PDF stays in RGB. The server has no login yet; login and a WordPress plugin may come later.

## Tech Stack
- **Language:** TypeScript
- **Frontend Framework:** React
- **Build Tool / Bundler:** Vite
- **Test Runner:** Jest + React Testing Library + jest-environment-jsdom (app); Node's test runner, `node --test` (server)
- **Linter:** ESLint
- **Backend:** optional CMYK server: Node (runs `.ts` directly) + Express 5, sharp (decodes pages), lcms-wasm (Little CMS, converts); its own package in `server/`

## Directory Structure
```
ManuallyInstant
    ├── docs
    │   └── adr
    ├── node_modules
    ├── public
    ├── server
    │   ├── profiles
    │   ├── src
    │   └── test
    ├── specs
    ├── src
    ├── test
    ├── .env.example
    ├── .gitignore
    ├── CLAUDE.md
    ├── eslint.config.js
    ├── index.html
    ├── jest.config.js
    ├── package-lock.json
    ├── package.json
    ├── PLAN.md
    ├── README.md
    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── tsconfig.test.json
    └── vite.config.ts
```

---

# 🇪🇸 ESPAÑOL

## Proyecto
Aplicación web creada con React, Vite y TypeScript que automatiza la creación de manuales de identidad visual. Las agencias de diseño completan la portada (título del manual con su estilo, "Designed by" y su logotipo principal), seleccionan fuentes de Google Fonts (principal y secundaria) y configuran paletas cromáticas mediante un selector interactivo que calcula automáticamente los valores HEX, RGB y CMYK, con un nombre libre para cada color. Todo este contenido se organiza dinámicamente en un manual limpio y responsivo de 10 páginas: portada → logo (concepto, anatomía, versiones, área de respeto) → usos (uso correcto e incorrecto, con hasta 6 ejemplos cada uno) → paleta de colores → tipografía → mockups (el logo en hasta 4 productos: ilustraciones dibujadas por la app, o fotos reales teñidas en WebGL, con un editor de plantillas). El usuario elige una de tres plantillas (Template 1, 2 o 3); la plantilla solo cambia dónde se ubica el contenido en cada página, nunca el contenido. El usuario también puede definir un skin: los colores de fondo y de texto de todas las páginas salvo la portada, y hasta 4 capas decorativas (degradados, formas, patrones, texturas) detrás de ellas, cada una con sus propios colores (elegidos libremente o copiados de la paleta), independiente de la plantilla. Finalmente, el sistema permite exportar el documento final en dos archivos PDF: uno para imprenta (alta resolución, valores CMYK destacados) y otro para pantalla u online (RGB/HEX, liviano).

No se guarda nada entre sesiones. Un servidor CMYK opcional y sin estado en `server/` (ADR 0018 y 0019, `specs/cmykserver.md`) convierte con un perfil ICC (FOGRA39, Colorimétrico relativo con compensación de punto negro, colores leídos como sRGB): con él, la paleta muestra los valores CMYK del perfil y el PDF de imprenta sale en CMYK real; sin él (sin `VITE_CMYK_SERVER_URL`), el CMYK es una aproximación y el PDF de imprenta sigue en RGB. El servidor todavía no tiene login; el login y un plugin de WordPress pueden llegar más adelante.

## Tech Stack
- **Lenguaje:** TypeScript
- **Framework de frontend:** React
- **Build / Bundler:** Vite
- **Tests:** Jest + React Testing Library + jest-environment-jsdom (app); el test runner de Node, `node --test` (servidor)
- **Linter:** ESLint
- **Backend:** servidor CMYK opcional: Node (ejecuta `.ts` directamente) + Express 5, sharp (decodifica las hojas), lcms-wasm (Little CMS, convierte); un paquete aparte en `server/`

## Estructura de carpetas
```
ManuallyInstant
    ├── docs
    │   └── adr
    ├── node_modules
    ├── public
    ├── server
    │   ├── profiles
    │   ├── src
    │   └── test
    ├── specs
    ├── src
    ├── test
    ├── .env.example
    ├── .gitignore
    ├── CLAUDE.md
    ├── eslint.config.js
    ├── index.html
    ├── jest.config.js
    ├── package-lock.json
    ├── package.json
    ├── PLAN.md
    ├── README.md
    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── tsconfig.test.json
    └── vite.config.ts
```
