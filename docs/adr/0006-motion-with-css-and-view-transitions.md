# ADR 0006: Motion with CSS and native browser APIs, no animation library

## Status
Accepted — 2026-10-11

## Context
The app needed more movement: buttons that react, a swatch fan, RGB and name pop-ups, and a preview that animates template, orientation and view changes (see `specs/motion.md`). Animation libraries such as Framer Motion (Motion) or React Spring would make this easy, but they add tens of KB and a new API to learn. Two parts are not trivial with plain CSS: the template layouts use `grid-template-areas`, which CSS cannot animate, and some elements must animate again on every repeated action.

## Decision
We will animate with what the browser already has:
* **CSS transitions and keyframes** for buttons, controls and pop-ups, with shared tokens (`--ease-bounce`, `--dur-*`) and keyframes (`pop`, `shake`, `pulse`) in `src/index.css`.
* The **View Transitions API** (`document.startViewTransition`, wrapped in `src/utils/viewTransition.ts`) for the preview, so the cover pieces glide between layouts.
* The **Web Animations API** (`element.animate()`) only where the same element must replay an animation on every action (the custom color picker's jump).
* Pop-ups and folded swatches always stay in the page and are hidden with `visibility` + `inert`, so they can animate both ways.

## Consequences
* **+** No new dependency: 0 KB added and nothing new to learn beyond CSS.
* **+** Motion values live in one place; changing the feel means changing a few tokens.
* **+** `prefers-reduced-motion` is handled in one CSS rule plus two JS checks.
* **−** The preview only animates in browsers with View Transitions; elsewhere it changes instantly.
* **−** `view-transition-name` must be unique on the page. It works because only the Cover page has content; when the Logo, Colors and Typography pages get content, their names must be unique too.
* **−** jsdom runs no animations, so tests check the state the CSS reads (`data-feedback`, `data-open`, `aria-expanded`, `inert`) instead of the movement.
