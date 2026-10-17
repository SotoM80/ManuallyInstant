# 🇬🇧 ENGLISH

## Project
A web application built with React, Vite and TypeScript that automates the creation of visual identity manuals. Design agencies fill in the cover (brand manual title with its style, "Designed by" and their primary logo), select Google Fonts (primary and secondary) and set up color palettes with an interactive picker that automatically calculates HEX, RGB and CMYK (approximate) values, with a free-text name for each color. All this content is organized dynamically into a clean, responsive 8-page manual: cover → logo (brand concept, anatomy, versions, clear space) → color palette → typography → mockups (the logo on up to 4 products: illustrations drawn by the app, or real photos tinted in WebGL, with a template editor). The user chooses one of three templates (Template 1, 2 or 3); a template only changes where the content sits on each page, never the content itself. The user can also set a skin: the background and text colors of every page but the Cover, and up to 4 decorative layers (gradients, shapes, patterns, textures) behind them, each with its own colors (picked freely or copied from the palette), independent of the template. Finally, the system exports the final document as two PDF files: one for print (high resolution, CMYK values highlighted) and one for screen or online use (RGB/HEX, lightweight).

Frontend only: there is no backend and nothing is saved between sessions. CMYK is an approximation, and the print PDF still uses the RGB color space.

## Tech Stack
- **Language:** TypeScript
- **Frontend Framework:** React
- **Build Tool / Bundler:** Vite
- **Test Runner:** Jest + React Testing Library + jest-environment-jsdom
- **Linter:** ESLint
- **Backend:** none (frontend only for the MVP)

## Directory Structure
```
ManuallyInstant
    ├── docs
    │   └── adr
    ├── node_modules
    ├── public
    ├── specs
    ├── src
    ├── test
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
Aplicación web creada con React, Vite y TypeScript que automatiza la creación de manuales de identidad visual. Las agencias de diseño completan la portada (título del manual con su estilo, "Designed by" y su logotipo principal), seleccionan fuentes de Google Fonts (principal y secundaria) y configuran paletas cromáticas mediante un selector interactivo que calcula automáticamente los valores HEX, RGB y CMYK (aproximado), con un nombre libre para cada color. Todo este contenido se organiza dinámicamente en un manual limpio y responsivo de 8 páginas: portada → logo (concepto, anatomía, versiones, área de respeto) → paleta de colores → tipografía → mockups (el logo en hasta 4 productos: ilustraciones dibujadas por la app, o fotos reales teñidas en WebGL, con un editor de plantillas). El usuario elige una de tres plantillas (Template 1, 2 o 3); la plantilla solo cambia dónde se ubica el contenido en cada página, nunca el contenido. El usuario también puede definir un skin: los colores de fondo y de texto de todas las páginas salvo la portada, y hasta 4 capas decorativas (degradados, formas, patrones, texturas) detrás de ellas, cada una con sus propios colores (elegidos libremente o copiados de la paleta), independiente de la plantilla. Finalmente, el sistema permite exportar el documento final en dos archivos PDF: uno para imprenta (alta resolución, valores CMYK destacados) y otro para pantalla u online (RGB/HEX, liviano).

Solo frontend: no hay backend ni se guarda nada entre sesiones. El CMYK es una aproximación y el PDF de imprenta sigue en espacio de color RGB.

## Tech Stack
- **Lenguaje:** TypeScript
- **Framework de frontend:** React
- **Build / Bundler:** Vite
- **Tests:** Jest + React Testing Library + jest-environment-jsdom
- **Linter:** ESLint
- **Backend:** ninguno (solo frontend en el MVP)

## Estructura de carpetas
```
ManuallyInstant
    ├── docs
    │   └── adr
    ├── node_modules
    ├── public
    ├── specs
    ├── src
    ├── test
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
