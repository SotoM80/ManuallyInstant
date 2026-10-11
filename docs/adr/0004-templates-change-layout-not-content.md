# ADR 0004: Templates change layout, not content

## Status
Accepted — 2026-10-11

## Context
Users choose between Template 1, 2 and 3 (`specs/templates.md`). If each template could add, remove or restyle content, every template would need its own data model, its own form fields and its own tests, and switching templates would lose or hide user data.

## Decision
A template only decides **where** content sits on each page. The content (title, logo, "Designed by", colors, fonts and their styles) is the same in every template. Templates are implemented as CSS only: `src/templates/index.ts` lists them and each `src/templates/templateN/` folder holds the CSS that places the content.

## Consequences
* **+** One data model and one set of page components serve all templates.
* **+** Switching templates is instant and never loses data.
* **+** Adding a template means adding a folder with CSS and one entry in `TEMPLATES`.
* **−** Templates cannot add their own decorations, extra content or different fonts/colors; a richer template would need a new ADR.
