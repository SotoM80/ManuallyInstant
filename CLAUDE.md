# 🇬🇧 ENGLISH

## Project
A web application built with React, Vite and TypeScript that automates the creation of visual identity manuals. Design agencies can enter the brand title, upload their primary logo, select Google Fonts (primary and secondary) and set up color palettes with an interactive picker that automatically calculates HEX, RGB and CMYK (approximate) values, with a free-text name for each color. All this content is organized dynamically into a single clean, responsive 4-page template: cover → logo → color palette → typography. Finally, the system exports the final document as two PDF files: one for print (high resolution, CMYK values highlighted) and one for screen or online use (RGB/HEX, lightweight).

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
    ├── node_modules
    ├── public
    ├── specs
    ├── src
    ├── test
    ├── .gitignore
    ├── CLAUDE.md
    ├── eslint.config.js
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── README.md
    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    └── vite.config.ts
```

---

# 🇪🇸 ESPAÑOL

## Proyecto
Aplicación web creada con React, Vite y TypeScript que automatiza la creación de manuales de identidad visual. Las agencias de diseño pueden ingresar el título de la marca, cargar su logotipo principal, seleccionar fuentes de Google Fonts (principal y secundaria) y configurar paletas cromáticas mediante un selector interactivo que calcula automáticamente los valores HEX, RGB y CMYK (aproximado), con un nombre libre para cada color. Todo este contenido se organiza dinámicamente en una plantilla única, limpia y responsiva de 4 páginas: portada → logo → paleta de colores → tipografía. Finalmente, el sistema permite exportar el documento final en dos archivos PDF: uno para imprenta (alta resolución, valores CMYK destacados) y otro para pantalla u online (RGB/HEX, liviano).

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
    ├── node_modules
    ├── public
    ├── specs
    ├── src
    ├── test
    ├── .gitignore
    ├── CLAUDE.md
    ├── eslint.config.js
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── README.md
    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    └── vite.config.ts
```
