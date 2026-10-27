# ADR 0017: Landing scroll motion with CSS scroll-driven animations, no scroll library

## Status
Proposed — 2026-10-27

## Context
The Home page becomes an expressive studio landing page (see `specs/landing.md`). Studios in this style (Locomotive, Koto, Build in Amsterdam) move content as the user scrolls: text that rises into view, words that light up, a band of words that never stops. They usually rely on Locomotive Scroll or GSAP ScrollTrigger, which add tens of KB, take over the browser's own scrolling and need care to respect reduced motion.

ADR 0006 already chose CSS and native browser APIs for the app's motion. Browsers can now tie a CSS animation to an element's position in the viewport (`animation-timeline: view()`), but not every browser supports it yet.

## Decision
We will drive the landing's scroll motion with **CSS scroll-driven animations** (`animation-timeline: view()` with `animation-range`), and the marquee with a plain looping CSS animation. In browsers without scroll timelines (`@supports not (animation-timeline: view())`), a small `IntersectionObserver` hook sets `data-visible` once an element enters the screen, and a CSS transition plays the same reveal. Scrolling stays the browser's own; the menu's anchors use `scroll-behavior: smooth`.

## Consequences
* **+** No new dependency, and scrolling is never hijacked: the keyboard, the trackpad and screen readers behave as on any page.
* **+** Reduced motion is already handled by the global rule in `src/index.css`, which makes these animations instant.
* **+** The animations run off the main thread in supporting browsers, so they stay smooth.
* **−** Two code paths for the reveal (scroll timeline and observer), which must end in the same state.
* **−** No pinned sections or scroll-scrubbed timelines as rich as GSAP's; the motion stays simple.
* **−** jsdom runs neither animations nor scroll timelines, so tests check that the content is there and visible, not how it moves.
